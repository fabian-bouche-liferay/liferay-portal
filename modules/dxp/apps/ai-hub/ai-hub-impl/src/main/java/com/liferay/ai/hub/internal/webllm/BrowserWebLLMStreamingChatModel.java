package com.liferay.ai.hub.internal.webllm;

import com.liferay.portal.kernel.log.Log;
import com.liferay.portal.kernel.log.LogFactoryUtil;

import java.time.Duration;
import java.util.Map;
import java.util.UUID;
import java.util.function.Consumer;
import java.util.function.Supplier;

import dev.langchain4j.model.chat.StreamingChatModel;
import dev.langchain4j.model.chat.request.ChatRequest;
import dev.langchain4j.model.chat.response.ChatResponse;
import dev.langchain4j.model.chat.response.StreamingChatResponseHandler;

public class BrowserWebLLMStreamingChatModel
	implements AutoCloseable, StreamingChatModel {

	public BrowserWebLLMStreamingChatModel(
		BrowserWebLLMWorkerRegistry browserWebLLMWorkerRegistry,
		long companyId, long userId, Duration timeout) {

		this(
			browserWebLLMWorkerRegistry, companyId, userId, timeout,
			(Supplier<StreamingChatModel>)null, null);
	}

	public BrowserWebLLMStreamingChatModel(
		BrowserWebLLMWorkerRegistry browserWebLLMWorkerRegistry,
		long companyId, long userId, Duration timeout,
		Supplier<StreamingChatModel> fallbackStreamingChatModelSupplier,
		Consumer<ChatResponse> onFallbackCompleteCallback) {

		this(
			browserWebLLMWorkerRegistry, companyId, userId, timeout,
			_DEFAULT_WORKER_WAIT_TIMEOUT, fallbackStreamingChatModelSupplier,
			onFallbackCompleteCallback);
	}

	public BrowserWebLLMStreamingChatModel(
		BrowserWebLLMWorkerRegistry browserWebLLMWorkerRegistry,
		long companyId, long userId, Duration timeout,
		Duration workerWaitTimeout,
		Supplier<StreamingChatModel> fallbackStreamingChatModelSupplier,
		Consumer<ChatResponse> onFallbackCompleteCallback) {

		_browserWebLLMWorkerRegistry = browserWebLLMWorkerRegistry;
		_companyId = companyId;
		_fallbackStreamingChatModelSupplier =
			fallbackStreamingChatModelSupplier;
		_onFallbackCompleteCallback = onFallbackCompleteCallback;
		_timeout = timeout;
		_userId = userId;
		_workerWaitTimeout = workerWaitTimeout;
	}

	@Override
	public void close() throws Exception {
		if (_fallbackStreamingChatModel instanceof AutoCloseable autoCloseable) {
			autoCloseable.close();
		}
	}

	@Override
	public void doChat(
		ChatRequest chatRequest,
		StreamingChatResponseHandler streamingChatResponseHandler) {

		try {
			_browserWebLLMWorkerRegistry.awaitAvailableWorker(
				_companyId, _userId, _workerWaitTimeout
			).ifPresentOrElse(
				browserWebLLMWorker -> _chat(
					browserWebLLMWorker, chatRequest,
					streamingChatResponseHandler),
				() -> _fallback(
					chatRequest, streamingChatResponseHandler,
					new IllegalStateException(
						"No available browser WebLLM worker for user " +
							_userId + " after waiting " +
							_workerWaitTimeout.toSeconds() + "s"))
			);
		}
		catch (InterruptedException interruptedException) {
			Thread.currentThread().interrupt();

			_fallback(
				chatRequest, streamingChatResponseHandler,
				interruptedException);
		}
	}

	private void _chat(
		BrowserWebLLMWorker browserWebLLMWorker, ChatRequest chatRequest,
		StreamingChatResponseHandler streamingChatResponseHandler) {

		BrowserWebLLMChatRequest browserWebLLMChatRequest =
			new BrowserWebLLMChatRequest();

		browserWebLLMChatRequest.setJobId(String.valueOf(UUID.randomUUID()));
		browserWebLLMChatRequest.setMessages(chatRequest.messages());
		browserWebLLMChatRequest.setOptions(
			Map.of(
				"stream", true,
				"timeout", _timeout.toMillis()));

		browserWebLLMWorker.chat(
			browserWebLLMChatRequest, _timeout,
			streamingChatResponseHandler);
	}

	private void _fallback(
		ChatRequest chatRequest,
		StreamingChatResponseHandler streamingChatResponseHandler,
		Throwable throwable) {

		if (_log.isWarnEnabled()) {
			_log.warn("No WebLLM worker available, falling back", throwable);
		}

		if (_fallbackStreamingChatModelSupplier == null) {
			streamingChatResponseHandler.onError(throwable);

			return;
		}

		_getFallbackStreamingChatModel().chat(
			chatRequest,
			new StreamingChatResponseHandler() {

				@Override
				public void onCompleteResponse(ChatResponse chatResponse) {
					if (_onFallbackCompleteCallback != null) {
						try {
							_onFallbackCompleteCallback.accept(chatResponse);
						}
						catch (Exception exception) {
							_log.warn(
								"Fallback complete callback failed", exception);
						}
					}

					streamingChatResponseHandler.onCompleteResponse(
						chatResponse);
				}

				@Override
				public void onError(Throwable t) {
					streamingChatResponseHandler.onError(t);
				}

				@Override
				public void onPartialResponse(String partialResponse) {
					streamingChatResponseHandler.onPartialResponse(
						partialResponse);
				}

			});
	}

	private StreamingChatModel _getFallbackStreamingChatModel() {
		if (_fallbackStreamingChatModel != null) {
			return _fallbackStreamingChatModel;
		}

		synchronized (this) {
			if (_fallbackStreamingChatModel == null) {
				_fallbackStreamingChatModel =
					_fallbackStreamingChatModelSupplier.get();
			}

			return _fallbackStreamingChatModel;
		}
	}

	private static final Log _log = LogFactoryUtil.getLog(
		BrowserWebLLMStreamingChatModel.class);

	private static final Duration _DEFAULT_WORKER_WAIT_TIMEOUT =
		Duration.ofSeconds(30);

	private final BrowserWebLLMWorkerRegistry _browserWebLLMWorkerRegistry;
	private final long _companyId;
	private volatile StreamingChatModel _fallbackStreamingChatModel;
	private final Supplier<StreamingChatModel>
		_fallbackStreamingChatModelSupplier;
	private final Consumer<ChatResponse> _onFallbackCompleteCallback;
	private final Duration _timeout;
	private final long _userId;
	private final Duration _workerWaitTimeout;

}
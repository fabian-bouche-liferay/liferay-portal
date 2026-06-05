package com.liferay.ai.hub.internal.webllm.websocket;

import com.liferay.ai.hub.internal.webllm.BrowserWebLLMCapabilities;
import com.liferay.ai.hub.internal.webllm.BrowserWebLLMChatRequest;
import com.liferay.ai.hub.internal.webllm.BrowserWebLLMWorker;
import com.liferay.ai.hub.internal.webllm.BrowserWebLLMWorkerStatus;

import java.time.Duration;
import java.util.Map;
import java.util.Objects;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.ScheduledFuture;
import java.util.concurrent.TimeUnit;

import dev.langchain4j.data.message.AiMessage;
import dev.langchain4j.model.chat.response.ChatResponse;
import dev.langchain4j.model.chat.response.StreamingChatResponseHandler;

public class BrowserWebLLMWebSocketWorker implements BrowserWebLLMWorker {

	public BrowserWebLLMWebSocketWorker(
		long companyId, long userId, String browserSessionId,
		BrowserWebLLMCapabilities browserWebLLMCapabilities,
		BrowserWebLLMWebSocketSender browserWebLLMWebSocketSender,
		ScheduledExecutorService scheduledExecutorService) {

		_companyId = companyId;
		_userId = userId;
		_browserSessionId = browserSessionId;
		_browserWebLLMCapabilities = browserWebLLMCapabilities;
		_browserWebLLMWebSocketSender = browserWebLLMWebSocketSender;
		_scheduledExecutorService = scheduledExecutorService;
	}

	@Override
	public void chat(
		BrowserWebLLMChatRequest browserWebLLMChatRequest, Duration timeout,
		StreamingChatResponseHandler streamingChatResponseHandler) {

		Objects.requireNonNull(browserWebLLMChatRequest);
		Objects.requireNonNull(timeout);
		Objects.requireNonNull(streamingChatResponseHandler);

		String jobId = browserWebLLMChatRequest.getJobId();

		if (_pendingJobs.containsKey(jobId)) {
			streamingChatResponseHandler.onError(
				new IllegalStateException("Duplicate WebLLM job " + jobId));

			return;
		}

		_status = BrowserWebLLMWorkerStatus.BUSY;

		ScheduledFuture<?> scheduledFuture =
			_scheduledExecutorService.schedule(
				() -> handleError(
					jobId, new RuntimeException(
						"Browser WebLLM job timed out: " + jobId)),
				timeout.toMillis(), TimeUnit.MILLISECONDS);

		_pendingJobs.put(
			jobId,
			new PendingJob(streamingChatResponseHandler, scheduledFuture));

		try {
			_browserWebLLMWebSocketSender.sendJob(browserWebLLMChatRequest);
		}
		catch (Exception exception) {
			handleError(jobId, exception);
		}
	}

	public void close() {
		_status = BrowserWebLLMWorkerStatus.DISCONNECTED;

		for (Map.Entry<String, PendingJob> entry : _pendingJobs.entrySet()) {
			handleError(
				entry.getKey(),
				new RuntimeException("Browser WebLLM worker disconnected"));
		}
	}

	@Override
	public String getBrowserSessionId() {
		return _browserSessionId;
	}

	@Override
	public BrowserWebLLMCapabilities getCapabilities() {
		return _browserWebLLMCapabilities;
	}

	public long getCompanyId() {
		return _companyId;
	}

	@Override
	public BrowserWebLLMWorkerStatus getStatus() {
		return _status;
	}

	public long getUserId() {
		return _userId;
	}

	public void setOnReadyCallback(Runnable onReadyCallback) {
		_onReadyCallback = onReadyCallback;
	}

	public void handleComplete(String jobId, String text) {
		PendingJob pendingJob = _pendingJobs.remove(jobId);

		if (pendingJob == null) {
			return;
		}

		pendingJob.cancelTimeout();

		_status = BrowserWebLLMWorkerStatus.READY;

		_onReadyCallback.run();

		pendingJob.getStreamingChatResponseHandler(
		).onCompleteResponse(
			ChatResponse.builder(
			).aiMessage(
				AiMessage.from(text)
			).build()
		);
	}

	public void handleError(String jobId, Throwable throwable) {
		PendingJob pendingJob = _pendingJobs.remove(jobId);

		if (pendingJob == null) {
			return;
		}

		pendingJob.cancelTimeout();

		_status = BrowserWebLLMWorkerStatus.READY;

		_onReadyCallback.run();

		pendingJob.getStreamingChatResponseHandler(
		).onError(
			throwable
		);
	}

	public void handleToken(String jobId, String token) {
		PendingJob pendingJob = _pendingJobs.get(jobId);

		if (pendingJob == null) {
			return;
		}

		pendingJob.getStreamingChatResponseHandler(
		).onPartialResponse(
			token
		);
	}

	private static class PendingJob {

		public PendingJob(
			StreamingChatResponseHandler streamingChatResponseHandler,
			ScheduledFuture<?> scheduledFuture) {

			_streamingChatResponseHandler = streamingChatResponseHandler;
			_scheduledFuture = scheduledFuture;
		}

		public void cancelTimeout() {
			_scheduledFuture.cancel(false);
		}

		public StreamingChatResponseHandler
			getStreamingChatResponseHandler() {

			return _streamingChatResponseHandler;
		}

		private final ScheduledFuture<?> _scheduledFuture;
		private final StreamingChatResponseHandler
			_streamingChatResponseHandler;

	}

	private final String _browserSessionId;
	private final BrowserWebLLMCapabilities _browserWebLLMCapabilities;
	private final BrowserWebLLMWebSocketSender _browserWebLLMWebSocketSender;
	private final long _companyId;
	private volatile Runnable _onReadyCallback = () -> {};
	private final Map<String, PendingJob> _pendingJobs =
		new ConcurrentHashMap<>();
	private final ScheduledExecutorService _scheduledExecutorService;
	private volatile BrowserWebLLMWorkerStatus _status =
		BrowserWebLLMWorkerStatus.READY;
	private final long _userId;

}
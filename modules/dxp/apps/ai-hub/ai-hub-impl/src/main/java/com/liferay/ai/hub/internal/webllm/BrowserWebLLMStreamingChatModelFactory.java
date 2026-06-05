package com.liferay.ai.hub.internal.webllm;

import dev.langchain4j.model.chat.StreamingChatModel;

import java.time.Duration;

import java.util.function.Supplier;

public class BrowserWebLLMStreamingChatModelFactory {

	public static BrowserWebLLMStreamingChatModel create(
		BrowserWebLLMWorkerRegistry browserWebLLMWorkerRegistry,
		long companyId, long userId, long timeoutMillis) {

		return new BrowserWebLLMStreamingChatModel(
			browserWebLLMWorkerRegistry, companyId, userId,
			Duration.ofMillis(timeoutMillis));
	}

	public static BrowserWebLLMStreamingChatModel create(
		BrowserWebLLMWorkerRegistry browserWebLLMWorkerRegistry,
		long companyId, long userId, long timeoutMillis,
		Supplier<StreamingChatModel> fallbackStreamingChatModelSupplier) {

		return new BrowserWebLLMStreamingChatModel(
			browserWebLLMWorkerRegistry, companyId, userId,
			Duration.ofMillis(timeoutMillis),
			fallbackStreamingChatModelSupplier, null);
	}

}
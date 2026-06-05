package com.liferay.ai.hub.internal.webllm;

import dev.langchain4j.model.chat.response.StreamingChatResponseHandler;

import java.time.Duration;

public interface BrowserWebLLMWorker {

	void chat(
		BrowserWebLLMChatRequest browserWebLLMChatRequest,
		Duration timeout,
		StreamingChatResponseHandler streamingChatResponseHandler);

	BrowserWebLLMCapabilities getCapabilities();

	String getBrowserSessionId();

	BrowserWebLLMWorkerStatus getStatus();

}
package com.liferay.ai.hub.internal.webllm.websocket;

import com.liferay.ai.hub.internal.webllm.BrowserWebLLMChatRequest;

public interface BrowserWebLLMWebSocketSender {

	void sendJob(BrowserWebLLMChatRequest browserWebLLMChatRequest)
		throws Exception;

}
package com.liferay.ai.hub.internal.webllm;

import dev.langchain4j.data.message.ChatMessage;

import java.util.List;
import java.util.Map;

public class BrowserWebLLMChatRequest {

	public String getJobId() {
		return _jobId;
	}

	public List<ChatMessage> getMessages() {
		return _messages;
	}

	public Map<String, Object> getOptions() {
		return _options;
	}

	public void setJobId(String jobId) {
		_jobId = jobId;
	}

	public void setMessages(List<ChatMessage> messages) {
		_messages = messages;
	}

	public void setOptions(Map<String, Object> options) {
		_options = options;
	}

	private String _jobId;
	private List<ChatMessage> _messages;
	private Map<String, Object> _options;

}
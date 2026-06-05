package com.liferay.ai.hub.internal.workflow.kaleo.runtime.node.model;

import dev.langchain4j.model.chat.StreamingChatModel;

public class LLMNodeChatModelImpl implements LLMNodeChatModel {

	public LLMNodeChatModelImpl(StreamingChatModel streamingChatModel) {
		_streamingChatModel = streamingChatModel;
	}

	@Override
	public void close() throws Exception {
		if (_streamingChatModel instanceof AutoCloseable autoCloseable) {
			autoCloseable.close();
		}
	}

	@Override
	public StreamingChatModel getStreamingChatModel() {
		return _streamingChatModel;
	}

	private final StreamingChatModel _streamingChatModel;

}
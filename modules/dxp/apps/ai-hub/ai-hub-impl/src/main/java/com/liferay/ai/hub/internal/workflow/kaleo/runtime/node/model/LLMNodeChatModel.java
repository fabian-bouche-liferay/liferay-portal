package com.liferay.ai.hub.internal.workflow.kaleo.runtime.node.model;

import dev.langchain4j.model.chat.StreamingChatModel;

public interface LLMNodeChatModel extends AutoCloseable {

	public StreamingChatModel getStreamingChatModel();

}
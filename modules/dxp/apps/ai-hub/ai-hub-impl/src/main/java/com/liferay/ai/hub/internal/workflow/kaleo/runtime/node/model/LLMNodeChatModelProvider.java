package com.liferay.ai.hub.internal.workflow.kaleo.runtime.node.model;

import com.liferay.portal.kernel.service.ServiceContext;

import java.io.Serializable;

import java.util.Map;

public interface LLMNodeChatModelProvider {

	LLMNodeChatModel create(
		Map<String, String> kaleoNodeSettingValues,
		ServiceContext serviceContext, String nodeName, String quotaText,
		Map<String, Serializable> workflowContext, long kaleoInstanceId);

}
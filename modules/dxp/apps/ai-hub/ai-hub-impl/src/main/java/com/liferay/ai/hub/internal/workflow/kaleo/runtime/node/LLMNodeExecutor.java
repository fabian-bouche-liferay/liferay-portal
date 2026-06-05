/**
 * SPDX-FileCopyrightText: (c) 2025 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

package com.liferay.ai.hub.internal.workflow.kaleo.runtime.node;

import com.liferay.ai.hub.internal.assistant.handler.AssistantHandlerContext;
import com.liferay.ai.hub.internal.assistant.handler.AssistantHandlerUtil;
import com.liferay.ai.hub.internal.mcp.tool.provider.MCPToolProviderUtil;
import com.liferay.ai.hub.internal.workflow.kaleo.runtime.node.model.LLMNodeChatModel;
import com.liferay.ai.hub.internal.workflow.kaleo.runtime.node.model.LLMNodeChatModelProvider;
import com.liferay.ai.hub.internal.workflow.kaleo.runtime.node.util.KaleoLogUtil;
import com.liferay.ai.hub.internal.workflow.kaleo.runtime.node.util.PromptUtil;
import com.liferay.ai.hub.internal.workflow.kaleo.runtime.node.util.RetrievalAugmentorUtil;
import com.liferay.ai.hub.internal.workflow.kaleo.runtime.node.util.ToolsUtil;
import com.liferay.ai.hub.internal.workflow.kaleo.runtime.node.util.VariablesUtil;
import com.liferay.ai.hub.rest.resource.v1_0.util.SseUtil;
import com.liferay.object.constants.ObjectDefinitionConstants;
import com.liferay.object.rest.manager.v1_0.ObjectEntryManager;
import com.liferay.petra.string.StringPool;
import com.liferay.portal.kernel.exception.PortalException;
import com.liferay.portal.kernel.json.JSONArray;
import com.liferay.portal.kernel.json.JSONException;
import com.liferay.portal.kernel.json.JSONFactory;
import com.liferay.portal.kernel.json.JSONObject;
import com.liferay.portal.kernel.log.Log;
import com.liferay.portal.kernel.log.LogFactoryUtil;
import com.liferay.portal.kernel.security.auth.CompanyInheritableThreadLocalCallable;
import com.liferay.portal.kernel.security.permission.PermissionThreadLocal;
import com.liferay.portal.kernel.service.ServiceContext;
import com.liferay.portal.kernel.util.GetterUtil;
import com.liferay.portal.kernel.util.Validator;
import com.liferay.portal.kernel.workflow.WorkflowNodeManager;
import com.liferay.portal.search.engine.adapter.SearchEngineAdapter;
import com.liferay.portal.search.highlight.FieldConfigBuilderFactory;
import com.liferay.portal.search.highlight.HighlightBuilderFactory;
import com.liferay.portal.vulcan.dto.converter.DTOConverterRegistry;
import com.liferay.portal.workflow.kaleo.definition.NodeType;
import com.liferay.portal.workflow.kaleo.model.KaleoInstanceToken;
import com.liferay.portal.workflow.kaleo.model.KaleoNode;
import com.liferay.portal.workflow.kaleo.model.KaleoNodeSetting;
import com.liferay.portal.workflow.kaleo.model.KaleoTransition;
import com.liferay.portal.workflow.kaleo.runtime.ExecutionContext;
import com.liferay.portal.workflow.kaleo.runtime.graph.PathElement;
import com.liferay.portal.workflow.kaleo.runtime.node.BaseNodeExecutor;
import com.liferay.portal.workflow.kaleo.runtime.node.NodeExecutor;
import com.liferay.portal.workflow.kaleo.service.KaleoNodeSettingLocalService;

import dev.langchain4j.data.message.AiMessage;
import dev.langchain4j.invocation.InvocationParameters;
import dev.langchain4j.model.chat.response.ChatResponse;

import java.io.Serializable;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.Callable;
import java.util.concurrent.atomic.AtomicReference;

import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.Reference;

/**
 * @author Feliphe Marinho
 */
@Component(service = NodeExecutor.class)
public class LLMNodeExecutor extends BaseNodeExecutor {

	@Override
	public NodeType getNodeType() {
		return NodeType.LLM;
	}

	@Override
	protected boolean doEnter(
		KaleoNode currentKaleoNode, ExecutionContext executionContext) {

		return true;
	}

	@Override
	protected void doExecute(
			KaleoNode currentKaleoNode, ExecutionContext executionContext,
			List<PathElement> remainingPathElements)
		throws PortalException {
		
		_log.warn("LLMNodeExecutor WebLLM-enabled version is executing");		

		KaleoInstanceToken kaleoInstanceToken =
			executionContext.getKaleoInstanceToken();

		Map<String, String> kaleoNodeSettingValues = new HashMap<>();

		List<KaleoNodeSetting> kaleoNodeSettings =
			_kaleoNodeSettingLocalService.getKaleoNodeSettings(
				currentKaleoNode.getKaleoNodeId());

		for (KaleoNodeSetting kaleoNodeSetting : kaleoNodeSettings) {
			kaleoNodeSettingValues.put(
				kaleoNodeSetting.getName(), kaleoNodeSetting.getValue());
		}

		String prompt = PromptUtil.composePrompt(
			kaleoInstanceToken.getCompanyId(), _dtoConverterRegistry,
			executionContext, kaleoNodeSettingValues, _objectEntryManager);
		String userMessage = VariablesUtil.applyInputVariables(
			executionContext, "userMessage", kaleoNodeSettingValues);

		ServiceContext serviceContext = executionContext.getServiceContext();

		Map<String, Serializable> workflowContext =
			executionContext.getWorkflowContext();

		LLMNodeChatModel llmNodeChatModel = _llmNodeChatModelProvider.create(
			kaleoNodeSettingValues, serviceContext,
			currentKaleoNode.getName(), prompt + "\n" + userMessage,
			workflowContext, kaleoInstanceToken.getKaleoInstanceId());

		AtomicReference<ChatResponse> chatResponseAtomicReference =
			new AtomicReference<>();

		Callable<Void> completeResponseCallable =
			new CompanyInheritableThreadLocalCallable<>(
				() -> {
					_completeResponse(
						chatResponseAtomicReference.get(), executionContext,
						currentKaleoNode, kaleoNodeSettingValues, prompt,
						userMessage);

					return null;
				});

		String sseEventSinkKey = GetterUtil.getString(
			workflowContext.get("sseEventSinkKey"));

		AssistantHandlerUtil.handle(
			AssistantHandlerContext.builder(
			).invocationParameters(
				InvocationParameters.from(
					Map.of(
						"executionContext", executionContext,
						"permissionChecker",
						PermissionThreadLocal.getPermissionChecker()))
			).memoryId(
				GetterUtil.getString(workflowContext.get("memoryId"))
			).onCompleteResponseConsumer(
				response -> {
					chatResponseAtomicReference.set(response);

					try {
						completeResponseCallable.call();
					}
					catch (Exception exception) {
						throw new RuntimeException(exception);
					}
					finally {
						MCPToolProviderUtil.close(sseEventSinkKey);

						_close(llmNodeChatModel);
					}
				}
			).onErrorConsumer(
				throwable -> {
					MCPToolProviderUtil.close(sseEventSinkKey);

					_close(llmNodeChatModel);

					_log.error(throwable);
				}
			).retrievalAugmentor(
				RetrievalAugmentorUtil.createRetrievalAugmentor(
					kaleoInstanceToken.getCompanyId(), _dtoConverterRegistry,
					_fieldConfigBuilderFactory, _highlightBuilderFactory,
					kaleoNodeSettingValues, serviceContext.getLocale(),
					_objectEntryManager, _searchEngineAdapter,
					serviceContext.getUserId(), workflowContext)
			).streamingChatModel(
				llmNodeChatModel.getStreamingChatModel()
			).systemMessageProviderFunction(
				memoryId -> prompt
			).toolProvider(
				MCPToolProviderUtil.create(
					kaleoInstanceToken.getCompanyId(), _dtoConverterRegistry,
					kaleoInstanceToken.getGroupId(), serviceContext.getLocale(),
					ToolsUtil.getMCPServerExternalReferenceCodes(
						_jsonFactory, kaleoNodeSettingValues),
					_objectEntryManager, sseEventSinkKey,
					serviceContext.getUserId(), workflowContext)
			).userMessage(
				userMessage
			).build());
	}

	@Override
	protected void doExit(
			KaleoNode currentKaleoNode, ExecutionContext executionContext,
			List<PathElement> remainingPathElements)
		throws PortalException {

		KaleoTransition kaleoTransition = null;

		if (Validator.isNull(executionContext.getTransitionName())) {
			kaleoTransition = currentKaleoNode.getDefaultKaleoTransition();
		}
		else {
			kaleoTransition = currentKaleoNode.getKaleoTransition(
				executionContext.getTransitionName());
		}

		remainingPathElements.add(
			new PathElement(
				null, kaleoTransition.getTargetKaleoNode(),
				new ExecutionContext(
					executionContext.getKaleoInstanceToken(),
					executionContext.getWorkflowContext(),
					executionContext.getServiceContext())));
	}

	private void _close(LLMNodeChatModel llmNodeChatModel) {
		try {
			llmNodeChatModel.close();
		}
		catch (Exception exception) {
			_log.error(exception);
		}
	}

	private void _completeResponse(
		ChatResponse chatResponse, ExecutionContext executionContext,
		KaleoNode kaleoNode, Map<String, String> kaleoNodeSettingValues,
		String prompt, String userMessage) {

		AiMessage aiMessage = chatResponse.aiMessage();

		Map<String, Serializable> workflowContext =
			executionContext.getWorkflowContext();

		JSONArray jsonArray = VariablesUtil.getVariablesJSONArray(
			"outputVariables", kaleoNodeSettingValues);

		if ((jsonArray != null) && (jsonArray.length() > 0)) {
			String text = aiMessage.text();

			workflowContext.put("output", text);

			String jsonText = _normalizeJSONOutput(text);

			try {
				JSONObject responseJSONObject = _jsonFactory.createJSONObject(
					jsonText);

				for (int i = 0; i < jsonArray.length(); i++) {
					JSONObject outputVariableJSONObject =
						jsonArray.getJSONObject(i);

					String name = outputVariableJSONObject.getString("name");

					if (responseJSONObject.has(name)) {
						workflowContext.put(
							name, responseJSONObject.getString(name));
					}
				}
			}
			catch (JSONException jsonException) {
				if (_log.isDebugEnabled()) {
					_log.debug(
						"LLM response is not a JSON object, using raw output",
						jsonException);
				}
			}
		}

		workflowContext.put("output", aiMessage.text());

		SseUtil.send(
			aiMessage.text(),
			GetterUtil.getString(workflowContext.get("outBoundEventName")),
			kaleoNode.getName(),
			GetterUtil.getString(workflowContext.get("sseEventSinkKey")));

		KaleoInstanceToken kaleoInstanceToken =
			executionContext.getKaleoInstanceToken();

		KaleoLogUtil.addNodeUsageKaleoLog(
			chatResponse, kaleoInstanceToken, aiMessage.text(), prompt,
			executionContext.getServiceContext(), userMessage);

		List<KaleoTransition> kaleoTransitions =
			kaleoNode.getKaleoTransitions();

		KaleoTransition kaleoTransition = kaleoTransitions.get(0);

		try {
			_workflowNodeManager.completeWorkflowNode(
				kaleoInstanceToken.getCompanyId(),
				kaleoInstanceToken.getUserId(),
				kaleoInstanceToken.getKaleoInstanceTokenId(),
				kaleoTransition.getName(), workflowContext, false);
		}
		catch (PortalException portalException) {
			throw new RuntimeException(portalException);
		}
	}

	private String _normalizeJSONOutput(String text) {
		if (text == null) {
			return StringPool.BLANK;
		}

		String trimmedText = text.trim();

		if (trimmedText.startsWith("```json")) {
			trimmedText = trimmedText.substring("```json".length()).trim();
		}
		else if (trimmedText.startsWith("```")) {
			trimmedText = trimmedText.substring("```".length()).trim();
		}

		if (trimmedText.endsWith("```")) {
			trimmedText = trimmedText.substring(
				0, trimmedText.length() - "```".length()).trim();
		}

		return trimmedText;
	}

	private static final Log _log = LogFactoryUtil.getLog(
		LLMNodeExecutor.class);

	@Reference
	private DTOConverterRegistry _dtoConverterRegistry;

	@Reference
	private FieldConfigBuilderFactory _fieldConfigBuilderFactory;

	@Reference
	private HighlightBuilderFactory _highlightBuilderFactory;

	@Reference
	private JSONFactory _jsonFactory;

	@Reference
	private KaleoNodeSettingLocalService _kaleoNodeSettingLocalService;

	@Reference
	private LLMNodeChatModelProvider _llmNodeChatModelProvider;

	@Reference(
		target = "(object.entry.manager.storage.type=" + ObjectDefinitionConstants.STORAGE_TYPE_DEFAULT + ")"
	)
	private ObjectEntryManager _objectEntryManager;

	@Reference
	private SearchEngineAdapter _searchEngineAdapter;

	@Reference
	private WorkflowNodeManager _workflowNodeManager;

}
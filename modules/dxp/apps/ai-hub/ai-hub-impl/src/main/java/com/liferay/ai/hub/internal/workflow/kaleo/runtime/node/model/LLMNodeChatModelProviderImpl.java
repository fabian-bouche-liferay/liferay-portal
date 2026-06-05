package com.liferay.ai.hub.internal.workflow.kaleo.runtime.node.model;

import com.liferay.ai.hub.internal.model.VertexAiGeminiUtil;
import com.liferay.ai.hub.internal.webllm.BrowserWebLLMStreamingChatModel;
import com.liferay.ai.hub.internal.webllm.BrowserWebLLMWorkerRegistry;
import com.liferay.ai.hub.internal.workflow.kaleo.runtime.node.util.QuotaUtil;
import com.liferay.portal.kernel.exception.PortalException;
import com.liferay.portal.kernel.log.Log;
import com.liferay.portal.kernel.log.LogFactoryUtil;
import com.liferay.portal.kernel.module.configuration.ConfigurationException;
import com.liferay.portal.kernel.service.ServiceContext;
import com.liferay.portal.kernel.util.GetterUtil;

import dev.langchain4j.model.chat.StreamingChatModel;
import dev.langchain4j.model.chat.response.ChatResponse;
import dev.langchain4j.model.output.TokenUsage;

import java.io.Serializable;

import java.time.Duration;

import java.util.Map;
import java.util.function.Consumer;
import java.util.function.Supplier;

import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.Reference;

@Component(service = LLMNodeChatModelProvider.class)
public class LLMNodeChatModelProviderImpl implements LLMNodeChatModelProvider {

	@Override
	public LLMNodeChatModel create(
		Map<String, String> kaleoNodeSettingValues,
		ServiceContext serviceContext, String nodeName, String quotaText,
		Map<String, Serializable> workflowContext, long kaleoInstanceId) {

		long timeoutMillis = GetterUtil.getLong(
			kaleoNodeSettingValues.get("browserWebLLMTimeout"), 180000);

		Supplier<StreamingChatModel> fallbackStreamingChatModelSupplier =
			() -> {
				try {
					QuotaUtil.checkUsage(
						serviceContext.getCompanyId(), nodeName, quotaText,
						workflowContext, kaleoInstanceId,
						serviceContext.getUserId());
				}
				catch (PortalException portalException) {
					throw new RuntimeException(portalException);
				}

				try {
					return VertexAiGeminiUtil.
						createVertexAiGeminiStreamingChatModel(
							serviceContext.getCompanyId());
				}
				catch (ConfigurationException configurationException) {
					throw new RuntimeException(
						"Unable to create Vertex AI Gemini chat model",
						configurationException);
				}
			};

		Consumer<ChatResponse> onFallbackCompleteCallback =
			chatResponse -> {
				TokenUsage tokenUsage = chatResponse.tokenUsage();

				if (tokenUsage == null) {
					return;
				}

				try {
					com.liferay.ai.hub.internal.quota.QuotaUtil.updateUsage(
						serviceContext.getCompanyId(),
						tokenUsage.outputTokenCount(),
						serviceContext.getUserId());
				}
				catch (PortalException portalException) {
					_log.warn("Failed to update quota usage", portalException);
				}
			};

		return new LLMNodeChatModelImpl(
			new BrowserWebLLMStreamingChatModel(
				_browserWebLLMWorkerRegistry,
				serviceContext.getCompanyId(),
				serviceContext.getUserId(),
				Duration.ofMillis(timeoutMillis),
				fallbackStreamingChatModelSupplier,
				onFallbackCompleteCallback));
	}

	private static final Log _log = LogFactoryUtil.getLog(
		LLMNodeChatModelProviderImpl.class);

	@Reference
	private BrowserWebLLMWorkerRegistry _browserWebLLMWorkerRegistry;

}
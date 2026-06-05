/**
 * SPDX-FileCopyrightText: (c) 2026 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

package com.liferay.ai.hub.internal.workflow.kaleo.runtime.node.util;

import com.liferay.portal.kernel.exception.PortalException;
import com.liferay.portal.kernel.log.Log;
import com.liferay.portal.kernel.log.LogFactoryUtil;
import com.liferay.portal.kernel.service.ServiceContext;
import com.liferay.portal.kernel.util.HashMapBuilder;
import com.liferay.portal.workflow.kaleo.model.KaleoInstanceToken;
import com.liferay.portal.workflow.kaleo.service.KaleoLogLocalServiceUtil;

import dev.langchain4j.model.chat.response.ChatResponse;
import dev.langchain4j.model.output.TokenUsage;

import java.io.Serializable;

/**
 * @author João Victor Alves
 */
public class KaleoLogUtil {

	public static void addNodeUsageKaleoLog(
		ChatResponse chatResponse, KaleoInstanceToken kaleoInstanceToken,
		String output, String prompt, ServiceContext serviceContext,
		String userMessage) {

		TokenUsage tokenUsage = chatResponse.metadata().tokenUsage();

		int inputTokenCount = _getTokenCount(
			tokenUsage, tokenUsage != null ? tokenUsage.inputTokenCount() : null);
		int outputTokenCount = _getTokenCount(
			tokenUsage, tokenUsage != null ? tokenUsage.outputTokenCount() : null);
		int totalTokenCount = _getTokenCount(
			tokenUsage, tokenUsage != null ? tokenUsage.totalTokenCount() : null);

		try {
			KaleoLogLocalServiceUtil.addNodeUsageMetadataKaleoLog(
				kaleoInstanceToken,
				HashMapBuilder.<String, Serializable>put(
					"inputTokenCount", String.valueOf(inputTokenCount)
				).put(
					"output", output
				).put(
					"outputTokenCount", String.valueOf(outputTokenCount)
				).put(
					"promptInput", prompt
				).put(
					"thoughtsTokenCount",
					String.valueOf(
						totalTokenCount - inputTokenCount - outputTokenCount)
				).put(
					"totalTokenCount", String.valueOf(totalTokenCount)
				).put(
					"userMessageInput", userMessage
				).build(),
				serviceContext);
		}
		catch (PortalException portalException) {
			_log.error(portalException);
		}
	}

	private static int _getTokenCount(TokenUsage tokenUsage, Integer value) {
		if ((tokenUsage == null) || (value == null)) {
			return 0;
		}

		return value;
	}

	private static final Log _log = LogFactoryUtil.getLog(KaleoLogUtil.class);

}
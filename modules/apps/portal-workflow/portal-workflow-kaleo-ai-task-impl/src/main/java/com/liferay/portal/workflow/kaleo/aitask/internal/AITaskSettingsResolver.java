/**
 * SPDX-FileCopyrightText: (c) 2000 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

package com.liferay.portal.workflow.kaleo.aitask.internal;

import com.liferay.portal.kernel.util.GetterUtil;
import com.liferay.portal.workflow.kaleo.aitask.internal.model.AITaskSettings;
import com.liferay.portal.workflow.kaleo.model.KaleoNode;
import com.liferay.portal.workflow.kaleo.model.KaleoNodeSetting;
import com.liferay.portal.workflow.kaleo.service.KaleoNodeSettingLocalService;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.Reference;

/**
 * @author Fabian Bouché
 */
@Component(service = AITaskSettingsResolver.class)
public class AITaskSettingsResolver {

	public AITaskSettings resolve(KaleoNode kaleoNode) {
		Map<String, String> values = new HashMap<>();

		List<KaleoNodeSetting> kaleoNodeSettings =
			_kaleoNodeSettingLocalService.getKaleoNodeSettings(
				kaleoNode.getKaleoNodeId());

		for (KaleoNodeSetting kaleoNodeSetting : kaleoNodeSettings) {
			values.put(
				kaleoNodeSetting.getName(), kaleoNodeSetting.getValue());
		}

		return new AITaskSettings(
			GetterUtil.getString(
				values.get("aiTaskDefinitionExternalReferenceCode")),
			values.get("inputMappings"),
			GetterUtil.getString(
				values.get("oauth2ClientExternalReferenceCode")),
			values.get("outputMappings"),
			GetterUtil.getString(values.get("remoteLiferayBaseURL")),
			GetterUtil.getLong(values.get("timeout"), 30000));
	}

	@Reference
	private KaleoNodeSettingLocalService _kaleoNodeSettingLocalService;

}
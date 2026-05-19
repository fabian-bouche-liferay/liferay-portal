/**
 * SPDX-FileCopyrightText: (c) 2000 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

package com.liferay.portal.workflow.kaleo.httpcall.internal;

import com.liferay.portal.kernel.util.GetterUtil;
import com.liferay.portal.workflow.kaleo.httpcall.internal.model.HTTPCallSettings;
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
@Component(service = HTTPCallSettingsResolver.class)
public class HTTPCallSettingsResolver {

	public HTTPCallSettings resolve(KaleoNode kaleoNode) {
		Map<String, String> values = new HashMap<>();

		List<KaleoNodeSetting> kaleoNodeSettings =
			_kaleoNodeSettingLocalService.getKaleoNodeSettings(
				kaleoNode.getKaleoNodeId());

		for (KaleoNodeSetting kaleoNodeSetting : kaleoNodeSettings) {
			values.put(
				kaleoNodeSetting.getName(), kaleoNodeSetting.getValue());
		}

		return new HTTPCallSettings(
			GetterUtil.getString(values.get("baseURL")),
			GetterUtil.getString(values.get("urlQuery")),
			GetterUtil.getString(values.get("httpBody")),
			GetterUtil.getString(values.get("httpMethod")),
			values.get("inputMappings"),
			values.get("outputMappings"),
			GetterUtil.getLong(values.get("timeout"), 30000));
	}

	@Reference
	private KaleoNodeSettingLocalService _kaleoNodeSettingLocalService;

}
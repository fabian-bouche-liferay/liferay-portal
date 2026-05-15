/**
 * SPDX-FileCopyrightText: (c) 2000 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

package com.liferay.portal.workflow.kaleo.aitask.internal.model;

/**
 * @author Fabian Bouché
 */
public class AITaskSettings {

	public AITaskSettings(
		String aiTaskDefinitionExternalReferenceCode, String inputMappings,
		String oAuth2ClientExternalReferenceCode, String outputMappings,
		String remoteLiferayBaseURL, long timeout) {

		_aiTaskDefinitionExternalReferenceCode =
			aiTaskDefinitionExternalReferenceCode;
		_inputMappings = inputMappings;
		_oAuth2ClientExternalReferenceCode =
			oAuth2ClientExternalReferenceCode;
		_outputMappings = outputMappings;
		_remoteLiferayBaseURL = remoteLiferayBaseURL;
		_timeout = timeout;
	}

	public String getAiTaskDefinitionExternalReferenceCode() {
		return _aiTaskDefinitionExternalReferenceCode;
	}

	public String getInputMappings() {
		return _inputMappings;
	}

	public String getOAuth2ClientExternalReferenceCode() {
		return _oAuth2ClientExternalReferenceCode;
	}

	public String getOutputMappings() {
		return _outputMappings;
	}

	public String getRemoteLiferayBaseURL() {
		return _remoteLiferayBaseURL;
	}

	public long getTimeout() {
		return _timeout;
	}

	private final String _aiTaskDefinitionExternalReferenceCode;
	private final String _inputMappings;
	private final String _oAuth2ClientExternalReferenceCode;
	private final String _outputMappings;
	private final String _remoteLiferayBaseURL;
	private final long _timeout;

}
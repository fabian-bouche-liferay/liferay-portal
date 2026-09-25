/**
 * SPDX-FileCopyrightText: (c) 2000 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import React, {useEffect, useState} from 'react';
import {ReactFlowProvider} from 'react-flow-renderer';

import '../../css/definition-builder/main.scss';
import {DefinitionBuilderContextProvider} from './DefinitionBuilderContext';
import DiagramBuilder from './diagram-builder/DiagramBuilder';
import {defaultNodes} from './diagram-builder/components/nodes/utils';
import {parseAgentInputVariableNames} from './diagram-builder/components/sidebar/sections/prompt/utils';
import UpperToolbar from './shared/components/toolbar/UpperToolbar';
import SourceBuilder from './source-builder/SourceBuilder';
import {retrieveAgentDefinitionByExternalReferenceCode} from './util/fetchUtil';

export default function DefinitionBuilder(props) {
	const [accountEntryId, setAccountEntryId] = useState(props.accountEntryId);
	const [agentInputVariableNames, setAgentInputVariableNames] = useState([]);
	const [active, setActive] = useState(true);
	const [alertMessage, setAlertMessage] = useState('');
	const [alertType, setAlertType] = useState(null);
	const [blockingError, setBlockingError] = useState({errorType: ''});
	const [currentEditor, setCurrentEditor] = useState(null);
	const [definitionDescription, setDefinitionDescription] = useState('');
	const [definitionInfo, setDefinitionInfo] = useState(null);
	const [definitionName, setDefinitionName] = useState(props.definitionName);
	const [definitionTitle, setDefinitionTitle] = useState(props.title);
	const [definitionTitleTranslations, setDefinitionTitleTranslations] =
		useState(props.translations);
	const [deserialize, setDeserialize] = useState(false);
	const [elements, setElements] = useState(defaultNodes);
	const [hadGroovyOrJavaScriptBefore, setHadGroovyOrJavaScriptBefore] =
		useState(false);
	const [hasGroovyOrJavaScript, setHasGroovyOrJavaScript] = useState(false);
	const [selectedLanguageId, setSelectedLanguageId] = useState('');
	const [showDefinitionInfo, setShowDefinitionInfo] = useState(false);
	const [sourceView, setSourceView] = useState(false);
	const [showAlert, setShowAlert] = useState(false);
	const [workflowDefinitionVersions, setWorkflowDefinitionVersions] =
		useState(props.definitionVersions ? props.definitionVersions : []);

	useEffect(() => {
		if (!props.agentDefinitionExternalReferenceCode) {
			return;
		}

		retrieveAgentDefinitionByExternalReferenceCode(
			props.agentDefinitionExternalReferenceCode
		)
			.then((response) => {
				if (!response.ok) {
					throw new Error(response.statusText);
				}

				return response.json();
			})
			.then(({inputVariables}) =>
				setAgentInputVariableNames(
					parseAgentInputVariableNames(inputVariables)
				)
			)
			.catch((error) => {
				console.error(error);
			});
	}, [props.agentDefinitionExternalReferenceCode]);

	const contextProps = {
		accountEntryId,
		active,
		agentInputVariableNames,
		alertMessage,
		alertType,
		allowScriptContentToBeExecutedOrIncluded:
			props.allowScriptContentToBeExecutedOrIncluded,
		blockingError,
		currentEditor,
		definitionDescription,
		definitionInfo,
		definitionName,
		definitionTitle,
		definitionTitleTranslations,
		deserialize,
		elements,
		functionActionExecutors: props.functionActionExecutors,
		hadGroovyOrJavaScriptBefore,
		hasGroovyOrJavaScript,
		scriptManagementConfigurationPortletURL:
			props.scriptManagementConfigurationPortletURL,
		selectedLanguageId,
		setAccountEntryId,
		setActive,
		setAlertMessage,
		setAlertType,
		setBlockingError,
		setCurrentEditor,
		setDefinitionDescription,
		setDefinitionInfo,
		setDefinitionName,
		setDefinitionTitle,
		setDefinitionTitleTranslations,
		setDeserialize,
		setElements,
		setHadGroovyOrJavaScriptBefore,
		setHasGroovyOrJavaScript,
		setSelectedLanguageId,
		setShowAlert,
		setShowDefinitionInfo,
		setSourceView,
		setWorkflowDefinitionVersions,
		showAlert,
		showDefinitionInfo,
		sourceView,
		statuses: props.statuses,
		timeZoneId: props.timeZoneId,
		versions: props.versions,
		workflowDefinitionVersions,
	};

	return (
		<ReactFlowProvider>
			<DefinitionBuilderContextProvider {...contextProps}>
				<div className="definition-builder-app">
					<UpperToolbar {...props} />

					{sourceView ? <SourceBuilder /> : <DiagramBuilder />}
				</div>
			</DefinitionBuilderContextProvider>
		</ReactFlowProvider>
	);
}

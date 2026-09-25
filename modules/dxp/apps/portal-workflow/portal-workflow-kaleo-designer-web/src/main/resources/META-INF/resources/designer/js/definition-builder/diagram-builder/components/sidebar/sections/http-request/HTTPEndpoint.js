/**
 * SPDX-FileCopyrightText: (c) 2026 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import ClayForm, {ClayInput, ClaySelect} from '@clayui/form';
import {sub} from 'frontend-js-web';
import React, {useContext, useState} from 'react';

import {DefinitionBuilderContext} from '../../../../../DefinitionBuilderContext';
import {defaultLanguageId} from '../../../../../constants';
import {DiagramBuilderContext} from '../../../../DiagramBuilderContext';
import SidebarPanel from '../../SidebarPanel';
import {getAvailableVariableGroups} from '../prompt/utils';
import OpenEditorButton from '../shared-components/OpenEditorButton';
import {getUpdatedDataItem} from '../utils';
import HTTPRequestEditorModal from './HTTPRequestEditorModal';
import {HTTP_METHODS} from './utils';

const HTTPEndpoint = () => {
	const {agentInputVariableNames, elements} = useContext(
		DefinitionBuilderContext
	);
	const {selectedItem, setSelectedItem} = useContext(DiagramBuilderContext);

	const [showHTTPRequestEditorModal, setShowHTTPRequestEditorModal] =
		useState(false);

	return (
		<SidebarPanel
			headerActions={
				<OpenEditorButton
					label={Liferay.Language.get('http-request')}
					onClick={() => setShowHTTPRequestEditorModal(true)}
				/>
			}
			panelTitle={Liferay.Language.get('http-endpoint')}
		>
			<ClayForm.Group>
				<label htmlFor="httpMethod">
					{Liferay.Language.get('http-method')}
				</label>

				<ClaySelect
					aria-label={Liferay.Language.get('http-method')}
					id="httpMethod"
					onChange={({target}) =>
						setSelectedItem(
							getUpdatedDataItem(
								'httpMethod',
								selectedItem,
								target
							)
						)
					}
					value={selectedItem?.data.httpMethod ?? 'GET'}
				>
					{HTTP_METHODS.map((httpMethod) => (
						<ClaySelect.Option
							key={httpMethod}
							label={httpMethod}
							value={httpMethod}
						/>
					))}
				</ClaySelect>
			</ClayForm.Group>

			<ClayForm.Group>
				<label htmlFor="url">{Liferay.Language.get('url')}</label>

				<ClayInput
					id="url"
					onChange={({target}) =>
						setSelectedItem(
							getUpdatedDataItem('url', selectedItem, target)
						)
					}
					placeholder="https://ai-sandbox.liferay.net/o/ai-hub/v1.0/..."
					required={true}
					type="text"
					value={selectedItem?.data.url ?? ''}
				/>
			</ClayForm.Group>

			{showHTTPRequestEditorModal && (
				<HTTPRequestEditorModal
					initialHTTPMethod={selectedItem?.data.httpMethod}
					initialInputVariables={selectedItem?.data.inputVariables}
					initialRequestBody={selectedItem?.data.requestBody}
					initialURL={selectedItem?.data.url}
					onApply={({httpMethod, inputVariables, requestBody, url}) =>
						setSelectedItem((previousSelectedItem) => ({
							...previousSelectedItem,
							data: {
								...previousSelectedItem.data,
								httpMethod,
								inputVariables,
								requestBody,
								url,
							},
						}))
					}
					onClose={() => setShowHTTPRequestEditorModal(false)}
					subtitle={selectedItem?.data.label?.[defaultLanguageId]}
					title={sub(
						Liferay.Language.get('edit-x'),
						Liferay.Language.get('http-request')
					)}
					variableGroups={getAvailableVariableGroups({
						agentInputVariableNames,
						elements,
						inputVariables: selectedItem?.data.inputVariables,
						selectedItemId: selectedItem?.id,
					})}
				/>
			)}
		</SidebarPanel>
	);
};

export default HTTPEndpoint;

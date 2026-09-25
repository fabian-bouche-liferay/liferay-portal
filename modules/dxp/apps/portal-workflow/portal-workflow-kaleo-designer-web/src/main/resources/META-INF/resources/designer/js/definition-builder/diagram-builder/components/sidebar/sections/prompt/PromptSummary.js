/**
 * SPDX-FileCopyrightText: (c) 2000 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import ClayForm, {ClayInput} from '@clayui/form';
import {sub} from 'frontend-js-web';
import PropTypes from 'prop-types';
import React, {useContext, useState} from 'react';

import {DefinitionBuilderContext} from '../../../../../DefinitionBuilderContext';
import {defaultLanguageId} from '../../../../../constants';
import {DiagramBuilderContext} from '../../../../DiagramBuilderContext';
import SidebarPanel from '../../SidebarPanel';
import InputOutputVariables from '../shared-components/InputOutputVariables';
import OpenEditorButton from '../shared-components/OpenEditorButton';
import PromptEditorModal from './PromptEditorModal';
import {getAvailableVariableGroups} from './utils';

const PromptSummary = () => {
	const {agentInputVariableNames, elements} = useContext(
		DefinitionBuilderContext
	);
	const {selectedItem, setSelectedItem} = useContext(DiagramBuilderContext);

	const [editedField, setEditedField] = useState(null);

	const updateSelectedItemData = (data) =>
		setSelectedItem((previousSelectedItem) => ({
			...previousSelectedItem,
			data: {
				...previousSelectedItem.data,
				...data,
			},
		}));

	return (
		<SidebarPanel
			headerActions={
				<OpenEditorButton
					label={Liferay.Language.get('prompt')}
					onClick={() => setEditedField('prompt')}
				/>
			}
			panelTitle={Liferay.Language.get('prompt')}
		>
			<ClayForm.Group>
				<ClayInput
					component="textarea"
					onChange={({target}) =>
						setSelectedItem({
							...selectedItem,
							data: {
								...selectedItem.data,
								prompt: target.value,
							},
						})
					}
					required={true}
					type="text"
					value={selectedItem?.data.prompt ?? ''}
				/>
			</ClayForm.Group>

			<InputOutputVariables />

			<ClayForm.Group>
				<div className="sidebar-field-header">
					<label htmlFor="userMessage">
						{Liferay.Language.get('user-message')}
					</label>

					<OpenEditorButton
						label={Liferay.Language.get('user-message')}
						onClick={() => setEditedField('userMessage')}
					/>
				</div>

				<ClayInput
					component="textarea"
					id="userMessage"
					onChange={({target}) =>
						setSelectedItem({
							...selectedItem,
							data: {
								...selectedItem.data,
								userMessage: target.value,
							},
						})
					}
					required={true}
					type="text"
					value={selectedItem?.data.userMessage ?? ''}
				/>
			</ClayForm.Group>

			{editedField === 'prompt' && (
				<PromptEditorModal
					initialValue={selectedItem?.data.prompt}
					label={Liferay.Language.get('prompt')}
					onApply={({value}) =>
						updateSelectedItemData({prompt: value})
					}
					onClose={() => setEditedField(null)}
					subtitle={selectedItem?.data.label?.[defaultLanguageId]}
					title={sub(
						Liferay.Language.get('edit-x'),
						Liferay.Language.get('prompt')
					)}
				/>
			)}

			{editedField === 'userMessage' && (
				<PromptEditorModal
					initialInputVariables={selectedItem?.data.inputVariables}
					initialValue={selectedItem?.data.userMessage}
					label={Liferay.Language.get('user-message')}
					onApply={({inputVariables, value}) =>
						updateSelectedItemData({
							inputVariables,
							userMessage: value,
						})
					}
					onClose={() => setEditedField(null)}
					subtitle={selectedItem?.data.label?.[defaultLanguageId]}
					title={sub(
						Liferay.Language.get('edit-x'),
						Liferay.Language.get('user-message')
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

PromptSummary.propTypes = {
	setContentName: PropTypes.func.isRequired,
};

export default PromptSummary;

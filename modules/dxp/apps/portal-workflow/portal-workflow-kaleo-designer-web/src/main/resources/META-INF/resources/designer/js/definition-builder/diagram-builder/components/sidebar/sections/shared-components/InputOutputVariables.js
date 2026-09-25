/**
 * SPDX-FileCopyrightText: (c) 2026 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import ClayForm, {ClayInput} from '@clayui/form';
import {sub} from 'frontend-js-web';
import React, {useContext, useMemo, useState} from 'react';

import {DefinitionBuilderContext} from '../../../../../DefinitionBuilderContext';
import {defaultLanguageId} from '../../../../../constants';
import {DiagramBuilderContext} from '../../../../DiagramBuilderContext';
import {
	formatVariablesForTextarea,
	parseVariablesInput,
} from '../../../../util/parseVariables';
import {
	getAvailableVariableGroups,
	getConsumedVariableGroups,
} from '../prompt/utils';
import OpenEditorButton from './OpenEditorButton';
import VariablesEditorModal from './VariablesEditorModal';

const PLACEHOLDER = '[{"name":"tone", "type":"string"}]';

// Only the first output variable receives the response of these node types

const SINGLE_OUTPUT_VARIABLE_NODE_TYPES = ['http-request', 'llm'];

const InputOutputVariables = () => {
	const {agentInputVariableNames, elements} = useContext(
		DefinitionBuilderContext
	);
	const {selectedItem, setSelectedItem} = useContext(DiagramBuilderContext);

	const [editedField, setEditedField] = useState(null);

	const inputVariablesValue = useMemo(
		() =>
			formatVariablesForTextarea(
				selectedItem?.data?.inputVariables,
				'[]'
			),
		[selectedItem]
	);

	const outputVariablesValue = useMemo(
		() =>
			formatVariablesForTextarea(
				selectedItem?.data?.outputVariables,
				'[]'
			),
		[selectedItem]
	);

	const handleVariablesChange =
		(field) =>
		({target}) => {
			if (!selectedItem) {
				return;
			}

			setSelectedItem({
				...selectedItem,
				data: {
					...selectedItem.data,
					[field]: parseVariablesInput(target.value),
				},
			});
		};

	let editedFieldInfo = null;
	let editedFieldLabel = Liferay.Language.get('input-variables');
	let nameHelp = Liferay.Language.get('input-variable-name-help');
	let typeHelp = Liferay.Language.get('input-variable-type-help');
	let variableGroups = getAvailableVariableGroups({
		agentInputVariableNames,
		elements,
		selectedItemId: selectedItem?.id,
	});

	if (editedField === 'outputVariables') {
		editedFieldLabel = Liferay.Language.get('output-variables');
		nameHelp = Liferay.Language.get('output-variable-name-help');
		typeHelp = Liferay.Language.get('output-variable-type-help');
		variableGroups = getConsumedVariableGroups({
			elements,
			selectedItemId: selectedItem?.id,
		});

		if (SINGLE_OUTPUT_VARIABLE_NODE_TYPES.includes(selectedItem?.type)) {
			editedFieldInfo = Liferay.Language.get(
				'only-the-first-output-variable-receives-the-node-response'
			);
		}
	}

	return (
		<>
			<ClayForm.Group>
				<div className="sidebar-field-header">
					<label htmlFor="inputVariables">
						{Liferay.Language.get('input-variables')}
					</label>

					<OpenEditorButton
						label={Liferay.Language.get('input-variables')}
						onClick={() => setEditedField('inputVariables')}
					/>
				</div>

				<ClayInput
					component="textarea"
					id="inputVariables"
					onChange={handleVariablesChange('inputVariables')}
					placeholder={PLACEHOLDER}
					type="text"
					value={inputVariablesValue}
				/>
			</ClayForm.Group>

			<ClayForm.Group>
				<div className="sidebar-field-header">
					<label htmlFor="outputVariables">
						{Liferay.Language.get('output-variables')}
					</label>

					<OpenEditorButton
						label={Liferay.Language.get('output-variables')}
						onClick={() => setEditedField('outputVariables')}
					/>
				</div>

				<ClayInput
					component="textarea"
					id="outputVariables"
					onChange={handleVariablesChange('outputVariables')}
					placeholder={PLACEHOLDER}
					type="text"
					value={outputVariablesValue}
				/>
			</ClayForm.Group>

			{editedField && (
				<VariablesEditorModal
					info={editedFieldInfo}
					initialVariables={selectedItem?.data[editedField]}
					nameHelp={nameHelp}
					onApply={(variables) =>
						setSelectedItem((previousSelectedItem) => ({
							...previousSelectedItem,
							data: {
								...previousSelectedItem.data,
								[editedField]: variables,
							},
						}))
					}
					onClose={() => setEditedField(null)}
					subtitle={selectedItem?.data.label?.[defaultLanguageId]}
					title={sub(
						Liferay.Language.get('edit-x'),
						editedFieldLabel
					)}
					typeHelp={typeHelp}
					variableGroups={variableGroups}
				/>
			)}
		</>
	);
};

export default InputOutputVariables;

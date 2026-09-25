/**
 * SPDX-FileCopyrightText: (c) 2026 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import {sub} from 'frontend-js-web';
import PropTypes from 'prop-types';
import React, {useMemo, useRef, useState} from 'react';

import EditorModal from '../shared-components/EditorModal';
import InsertVariableDropDown from './InsertVariableDropDown';
import PromptCodeMirrorEditor from './PromptCodeMirrorEditor';
import UndeclaredVariablesAlert from './UndeclaredVariablesAlert';
import VariablesHelpPopover from './VariablesHelpPopover';
import {
	DEFAULT_VARIABLE_TYPE,
	addInputVariables,
	getUndeclaredVariableNames,
} from './utils';

export default function PromptEditorModal({
	initialInputVariables,
	initialValue,
	label,
	onApply,
	onClose,
	subtitle,
	title,
	variableGroups,
}) {
	const editorRef = useRef(null);

	const [inputVariables, setInputVariables] = useState(
		initialInputVariables ?? []
	);
	const [value, setValue] = useState(initialValue ?? '');

	const variablesEnabled = Array.isArray(variableGroups);

	// Input variables that are not a valid JSON array are left untouched so
	// that the user does not lose what is typed in the sidebar

	const inputVariablesEditable =
		variablesEnabled && Array.isArray(inputVariables);

	const undeclaredVariableNames = useMemo(
		() =>
			inputVariablesEditable
				? getUndeclaredVariableNames(value, inputVariables)
				: [],
		[inputVariables, inputVariablesEditable, value]
	);

	const declareVariables = (variables) => {
		if (inputVariablesEditable) {
			setInputVariables(addInputVariables(inputVariables, variables));
		}
	};

	const insertVariable = (variable) => {
		const editor = editorRef.current;

		editor.replaceSelection(`{{${variable.name}}}`);

		editor.focus();

		declareVariables([variable]);
	};

	return (
		<EditorModal
			className="prompt-editor-modal"
			footerInfo={
				<span className="text-secondary">
					{sub(Liferay.Language.get('x-characters'), value.length)}
				</span>
			}
			onApply={() =>
				onApply(variablesEnabled ? {inputVariables, value} : {value})
			}
			onClose={onClose}
			subtitle={subtitle}
			title={title}
		>
			{variablesEnabled && (
				<div className="prompt-editor-modal-toolbar">
					<VariablesHelpPopover />

					<InsertVariableDropDown
						onInsert={insertVariable}
						variableGroups={variableGroups}
					/>
				</div>
			)}

			<PromptCodeMirrorEditor
				ariaLabel={label}
				onChange={setValue}
				ref={editorRef}
				value={value}
				variablesHighlighted={variablesEnabled}
			/>

			<UndeclaredVariablesAlert
				names={undeclaredVariableNames}
				onDeclare={() =>
					declareVariables(
						undeclaredVariableNames.map((name) => ({
							name,
							type: DEFAULT_VARIABLE_TYPE,
						}))
					)
				}
			/>
		</EditorModal>
	);
}

PromptEditorModal.propTypes = {
	initialInputVariables: PropTypes.oneOfType([
		PropTypes.array,
		PropTypes.string,
	]),
	initialValue: PropTypes.string,
	label: PropTypes.string.isRequired,
	onApply: PropTypes.func.isRequired,
	onClose: PropTypes.func.isRequired,
	subtitle: PropTypes.string,
	title: PropTypes.string.isRequired,
	variableGroups: PropTypes.arrayOf(
		PropTypes.shape({
			label: PropTypes.string.isRequired,
			variables: PropTypes.arrayOf(
				PropTypes.shape({
					name: PropTypes.string.isRequired,
					type: PropTypes.string,
				})
			).isRequired,
		})
	),
};

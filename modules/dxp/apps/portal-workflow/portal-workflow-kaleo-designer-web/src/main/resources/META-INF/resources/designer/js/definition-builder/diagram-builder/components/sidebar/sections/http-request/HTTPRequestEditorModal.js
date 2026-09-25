/**
 * SPDX-FileCopyrightText: (c) 2026 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import ClayAlert from '@clayui/alert';
import ClayForm, {ClayInput, ClaySelect} from '@clayui/form';
import PropTypes from 'prop-types';
import React, {useId, useRef, useState} from 'react';

import InsertVariableDropDown from '../prompt/InsertVariableDropDown';
import PromptCodeMirrorEditor from '../prompt/PromptCodeMirrorEditor';
import UndeclaredVariablesAlert from '../prompt/UndeclaredVariablesAlert';
import VariablesHelpPopover from '../prompt/VariablesHelpPopover';
import {
	DEFAULT_VARIABLE_TYPE,
	addInputVariables,
	getUndeclaredVariableNames,
} from '../prompt/utils';
import EditorModal from '../shared-components/EditorModal';
import QueryParametersTable from './QueryParametersTable';
import {
	HTTP_METHODS,
	buildURL,
	isLiferayDXPURL,
	isValidJSONBody,
	parseURL,
} from './utils';

function insertTextAtCursor(input, text) {
	const end = input.selectionEnd ?? input.value.length;
	const start = input.selectionStart ?? input.value.length;

	return {
		caret: start + text.length,
		value: input.value.slice(0, start) + text + input.value.slice(end),
	};
}

export default function HTTPRequestEditorModal({
	initialHTTPMethod,
	initialInputVariables,
	initialRequestBody,
	initialURL,
	onApply,
	onClose,
	subtitle,
	title,
	variableGroups,
}) {
	const httpMethodId = useId();
	const requestBodyHelpTextId = useId();
	const urlId = useId();

	const focusedFieldRef = useRef({field: 'url'});
	const nextQueryParameterIdRef = useRef(0);
	const queryParameterInputsRef = useRef(new Map());
	const requestBodyEditorRef = useRef(null);
	const urlInputRef = useRef(null);

	const [baseURL, setBaseURL] = useState(() => parseURL(initialURL).baseURL);
	const [httpMethod, setHTTPMethod] = useState(initialHTTPMethod || 'GET');
	const [inputVariables, setInputVariables] = useState(
		initialInputVariables ?? []
	);
	const [queryParameters, setQueryParameters] = useState(() =>
		parseURL(initialURL).queryParameters.map((queryParameter) => ({
			...queryParameter,
			id: nextQueryParameterIdRef.current++,
		}))
	);
	const [requestBody, setRequestBody] = useState(initialRequestBody ?? '');

	const url = buildURL(baseURL, queryParameters);

	// Input variables that are not a valid JSON array are left untouched so
	// that the user does not lose what is typed in the sidebar

	const inputVariablesEditable = Array.isArray(inputVariables);

	const undeclaredVariableNames = inputVariablesEditable
		? getUndeclaredVariableNames(`${url}\n${requestBody}`, inputVariables)
		: [];

	const declareVariables = (variables) => {
		if (inputVariablesEditable) {
			setInputVariables(addInputVariables(inputVariables, variables));
		}
	};

	const updateQueryParameter = (id, key, value) =>
		setQueryParameters((previousQueryParameters) =>
			previousQueryParameters.map((queryParameter) =>
				queryParameter.id === id
					? {...queryParameter, [key]: value}
					: queryParameter
			)
		);

	const insertIntoInput = (input, text, onValueChange) => {
		const {caret, value} = insertTextAtCursor(input, text);

		onValueChange(value);

		requestAnimationFrame(() => {
			input.focus();
			input.setSelectionRange(caret, caret);
		});
	};

	const insertVariable = (variable) => {
		const {field, id, key} = focusedFieldRef.current;
		const text = `{{${variable.name}}}`;

		if (field === 'requestBody') {
			requestBodyEditorRef.current.replaceSelection(text);
			requestBodyEditorRef.current.focus();
		}
		else if (field === 'queryParameter') {
			insertIntoInput(
				queryParameterInputsRef.current.get(`${id}_${key}`),
				text,
				(value) => updateQueryParameter(id, key, value)
			);
		}
		else {
			insertIntoInput(urlInputRef.current, text, setBaseURL);
		}

		declareVariables([
			{name: variable.name, type: variable.type || DEFAULT_VARIABLE_TYPE},
		]);
	};

	return (
		<EditorModal
			className="http-request-editor-modal"
			icon="globe"
			onApply={() =>
				onApply({httpMethod, inputVariables, requestBody, url})
			}
			onClose={onClose}
			subtitle={subtitle}
			title={title}
		>
			<div className="http-request-editor-modal-toolbar">
				<ClayForm.Group className="mb-0">
					<label htmlFor={httpMethodId}>
						{Liferay.Language.get('http-method')}
					</label>

					<ClaySelect
						id={httpMethodId}
						onChange={({target}) => setHTTPMethod(target.value)}
						value={httpMethod}
					>
						{HTTP_METHODS.map((method) => (
							<ClaySelect.Option
								key={method}
								label={method}
								value={method}
							/>
						))}
					</ClaySelect>
				</ClayForm.Group>

				<div className="http-request-editor-modal-toolbar-actions">
					<VariablesHelpPopover />

					<InsertVariableDropDown
						onInsert={insertVariable}
						variableGroups={variableGroups}
					/>
				</div>
			</div>

			<ClayForm.Group>
				<label htmlFor={urlId}>{Liferay.Language.get('url')}</label>

				<ClayInput
					aria-describedby={`${urlId}HelpText`}
					id={urlId}
					onChange={({target}) => setBaseURL(target.value)}
					onFocus={() => {
						focusedFieldRef.current = {field: 'url'};
					}}
					placeholder="{{aiHubCellLiferayDXPURL}}/o/..."
					ref={urlInputRef}
					value={baseURL}
				/>

				<ClayForm.Text id={`${urlId}HelpText`}>
					{Liferay.Language.get('http-request-url-help')}
				</ClayForm.Text>
			</ClayForm.Group>

			<ClayForm.Group>
				<label>{Liferay.Language.get('query-parameters')}</label>

				<QueryParametersTable
					inputRef={(id, key, element) => {
						if (element) {
							queryParameterInputsRef.current.set(
								`${id}_${key}`,
								element
							);
						}
						else {
							queryParameterInputsRef.current.delete(
								`${id}_${key}`
							);
						}
					}}
					onAdd={() =>
						setQueryParameters((previousQueryParameters) => [
							...previousQueryParameters,
							{
								hasValue: true,
								id: nextQueryParameterIdRef.current++,
								name: '',
								value: '',
							},
						])
					}
					onChange={updateQueryParameter}
					onDelete={(id) =>
						setQueryParameters((previousQueryParameters) =>
							previousQueryParameters.filter(
								(queryParameter) => queryParameter.id !== id
							)
						)
					}
					onFocus={(id, key) => {
						focusedFieldRef.current = {
							field: 'queryParameter',
							id,
							key,
						};
					}}
					queryParameters={queryParameters}
				/>

				<ClayForm.Text className="d-block">
					{Liferay.Language.get('query-parameters-help')}
				</ClayForm.Text>
			</ClayForm.Group>

			<ClayForm.Group>
				<label>{Liferay.Language.get('request-body')}</label>

				<PromptCodeMirrorEditor
					ariaLabel={Liferay.Language.get('request-body')}
					autoFocus={false}
					language="json"
					onChange={setRequestBody}
					onFocus={() => {
						focusedFieldRef.current = {field: 'requestBody'};
					}}
					ref={requestBodyEditorRef}
					value={requestBody}
					variablesHighlighted
				/>

				<ClayForm.Text id={requestBodyHelpTextId}>
					{Liferay.Language.get('http-request-body-help')}
				</ClayForm.Text>

				{!isValidJSONBody(requestBody) && (
					<ClayAlert className="mb-0 mt-2" displayType="warning">
						{Liferay.Language.get(
							'the-request-body-is-not-valid-json'
						)}
					</ClayAlert>
				)}
			</ClayForm.Group>

			{url.trim() && !isLiferayDXPURL(url) ? (
				<ClayAlert className="mb-0" displayType="warning">
					{Liferay.Language.get(
						'the-access-token-of-the-current-user-is-sent-with-this-request-only-call-liferay-dxp-or-trusted-services'
					)}
				</ClayAlert>
			) : (
				<ClayAlert className="mb-0" displayType="info">
					{Liferay.Language.get(
						'requests-are-made-on-behalf-of-the-current-user-the-authorization-header-is-set-automatically'
					)}
				</ClayAlert>
			)}

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

HTTPRequestEditorModal.propTypes = {
	initialHTTPMethod: PropTypes.string,
	initialInputVariables: PropTypes.oneOfType([
		PropTypes.array,
		PropTypes.string,
	]),
	initialRequestBody: PropTypes.string,
	initialURL: PropTypes.string,
	onApply: PropTypes.func.isRequired,
	onClose: PropTypes.func.isRequired,
	subtitle: PropTypes.string,
	title: PropTypes.string.isRequired,
	variableGroups: PropTypes.array.isRequired,
};

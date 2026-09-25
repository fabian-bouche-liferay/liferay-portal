/**
 * SPDX-FileCopyrightText: (c) 2026 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import ClayAlert from '@clayui/alert';
import ClayButton, {ClayButtonWithIcon} from '@clayui/button';
import ClayForm, {ClayInput, ClaySelect} from '@clayui/form';
import ClayIcon from '@clayui/icon';
import classNames from 'classnames';
import PropTypes from 'prop-types';
import React, {useMemo, useRef, useState} from 'react';

import InsertVariableDropDown from '../prompt/InsertVariableDropDown';
import EditorModal from './EditorModal';
import HelpIcon from './HelpIcon';

const VARIABLE_TYPES = ['string', 'json'];

function getVariableTypeLabel(type) {
	if (type === 'json') {
		return Liferay.Language.get('json');
	}

	if (type === 'string') {
		return Liferay.Language.get('string');
	}

	return type;
}

function VariableRow({
	error,
	onChange,
	onDelete,
	onSelectVariable,
	variable,
	variableGroups,
}) {
	const types = VARIABLE_TYPES.includes(variable.type)
		? VARIABLE_TYPES
		: [...VARIABLE_TYPES, variable.type];

	return (
		<tr>
			<td className="table-cell-expand">
				<ClayForm.Group
					className={classNames('mb-0', {'has-error': error})}
				>
					<ClayInput.Group>
						<ClayInput.GroupItem prepend={!!variableGroups}>
							<ClayInput
								aria-label={Liferay.Language.get('name')}
								onChange={({target}) =>
									onChange('name', target.value)
								}
								placeholder={Liferay.Language.get(
									'enter-a-variable-name'
								)}
								value={variable.name ?? ''}
							/>
						</ClayInput.GroupItem>

						{variableGroups && (
							<ClayInput.GroupItem append shrink>
								<InsertVariableDropDown
									onInsert={onSelectVariable}
									trigger={
										<ClayButton
											aria-label={Liferay.Language.get(
												'select-a-variable'
											)}
											displayType="secondary"
											title={Liferay.Language.get(
												'select-a-variable'
											)}
										>
											<ClayIcon symbol="code" />

											<span className="inline-item inline-item-after">
												<ClayIcon symbol="caret-bottom" />
											</span>
										</ClayButton>
									}
									variableGroups={variableGroups}
								/>
							</ClayInput.GroupItem>
						)}
					</ClayInput.Group>

					{error && (
						<ClayForm.FeedbackGroup>
							<ClayForm.FeedbackItem>
								<ClayIcon symbol="exclamation-full" />

								{error}
							</ClayForm.FeedbackItem>
						</ClayForm.FeedbackGroup>
					)}
				</ClayForm.Group>
			</td>

			<td>
				<ClaySelect
					aria-label={Liferay.Language.get('type')}
					className="variables-editor-modal-type"
					onChange={({target}) => onChange('type', target.value)}
					value={variable.type}
				>
					{types.map((type) => (
						<ClaySelect.Option
							key={type}
							label={getVariableTypeLabel(type)}
							value={type}
						/>
					))}
				</ClaySelect>
			</td>

			<td>
				<ClayButtonWithIcon
					aria-label={Liferay.Language.get('delete')}
					displayType="unstyled"
					onClick={onDelete}
					symbol="trash"
					title={Liferay.Language.get('delete')}
				/>
			</td>
		</tr>
	);
}

export default function VariablesEditorModal({
	info,
	initialVariables,
	nameHelp,
	onApply,
	onClose,
	subtitle,
	title,
	typeHelp,
	variableGroups,
}) {
	const nextRowIdRef = useRef(0);

	const createRow = (variable) => ({
		id: nextRowIdRef.current++,
		variable,
	});

	const [rows, setRows] = useState(() =>
		Array.isArray(initialVariables) ? initialVariables.map(createRow) : []
	);

	const invalidInitialVariables =
		initialVariables !== undefined && !Array.isArray(initialVariables);

	const errors = useMemo(() => {
		const names = rows.map(({variable}) => variable.name?.trim());

		return rows.map((row, index) => {
			if (!names[index]) {
				return Liferay.Language.get('this-field-is-required');
			}

			if (names.indexOf(names[index]) !== index) {
				return Liferay.Language.get('variable-names-must-be-unique');
			}

			return null;
		});
	}, [rows]);

	const updateVariable = (id, key, value) =>
		setRows((previousRows) =>
			previousRows.map((row) =>
				row.id === id
					? {...row, variable: {...row.variable, [key]: value}}
					: row
			)
		);

	return (
		<EditorModal
			applyDisabled={errors.some(Boolean)}
			className="variables-editor-modal"
			onApply={() =>
				onApply(
					rows.map(({variable}) => ({
						...variable,
						name: variable.name.trim(),
					}))
				)
			}
			onClose={onClose}
			subtitle={subtitle}
			title={title}
		>
			{invalidInitialVariables && (
				<ClayAlert displayType="warning">
					{Liferay.Language.get(
						'the-current-value-is-not-valid-json-and-will-be-replaced'
					)}
				</ClayAlert>
			)}

			{info && <ClayAlert displayType="info">{info}</ClayAlert>}

			{!!rows.length && (
				<table className="table table-autofit">
					<thead>
						<tr>
							<th className="table-cell-expand">
								{Liferay.Language.get('name')}

								{nameHelp && (
									<HelpIcon
										className="ml-2"
										message={nameHelp}
									/>
								)}
							</th>

							<th>
								{Liferay.Language.get('type')}

								{typeHelp && (
									<HelpIcon
										className="ml-2"
										message={typeHelp}
									/>
								)}
							</th>

							<th />
						</tr>
					</thead>

					<tbody>
						{rows.map(({id, variable}, index) => (
							<VariableRow
								error={errors[index]}
								key={id}
								onChange={(key, value) =>
									updateVariable(id, key, value)
								}
								onDelete={() =>
									setRows((previousRows) =>
										previousRows.filter(
											(row) => row.id !== id
										)
									)
								}
								onSelectVariable={({name, type}) => {
									updateVariable(id, 'name', name);
									updateVariable(
										id,
										'type',
										type || VARIABLE_TYPES[0]
									);
								}}
								variable={variable}
								variableGroups={variableGroups}
							/>
						))}
					</tbody>
				</table>
			)}

			<ClayButton
				className="mt-3"
				displayType="secondary"
				onClick={() =>
					setRows((previousRows) => [
						...previousRows,
						createRow({name: '', type: VARIABLE_TYPES[0]}),
					])
				}
				size="sm"
			>
				<span className="inline-item inline-item-before">
					<ClayIcon symbol="plus" />
				</span>

				{Liferay.Language.get('add-variable')}
			</ClayButton>
		</EditorModal>
	);
}

VariablesEditorModal.propTypes = {
	info: PropTypes.string,
	initialVariables: PropTypes.oneOfType([PropTypes.array, PropTypes.string]),
	nameHelp: PropTypes.string,
	onApply: PropTypes.func.isRequired,
	onClose: PropTypes.func.isRequired,
	subtitle: PropTypes.string,
	title: PropTypes.string.isRequired,
	typeHelp: PropTypes.string,
	variableGroups: PropTypes.array,
};

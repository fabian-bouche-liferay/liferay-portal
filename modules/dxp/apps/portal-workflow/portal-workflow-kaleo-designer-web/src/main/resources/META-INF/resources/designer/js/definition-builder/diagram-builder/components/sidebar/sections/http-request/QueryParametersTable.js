/**
 * SPDX-FileCopyrightText: (c) 2026 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import ClayButton, {ClayButtonWithIcon} from '@clayui/button';
import {ClayInput} from '@clayui/form';
import ClayIcon from '@clayui/icon';
import PropTypes from 'prop-types';
import React from 'react';

const QUERY_PARAMETER_KEYS = ['name', 'value'];

function QueryParameterRow({
	inputRef,
	onChange,
	onDelete,
	onFocus,
	queryParameter,
}) {
	return (
		<tr>
			{QUERY_PARAMETER_KEYS.map((key) => (
				<td className="table-cell-expand" key={key}>
					<ClayInput
						aria-label={Liferay.Language.get(key)}
						onChange={({target}) => onChange(key, target.value)}
						onFocus={() => onFocus(key)}
						ref={(element) => inputRef(key, element)}
						value={queryParameter[key]}
					/>
				</td>
			))}

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

export default function QueryParametersTable({
	inputRef,
	onAdd,
	onChange,
	onDelete,
	onFocus,
	queryParameters,
}) {
	return (
		<>
			{!!queryParameters.length && (
				<table className="table table-autofit">
					<thead>
						<tr>
							<th className="table-cell-expand">
								{Liferay.Language.get('name')}
							</th>

							<th className="table-cell-expand">
								{Liferay.Language.get('value')}
							</th>

							<th />
						</tr>
					</thead>

					<tbody>
						{queryParameters.map((queryParameter) => (
							<QueryParameterRow
								inputRef={(key, element) =>
									inputRef(queryParameter.id, key, element)
								}
								key={queryParameter.id}
								onChange={(key, value) =>
									onChange(queryParameter.id, key, value)
								}
								onDelete={() => onDelete(queryParameter.id)}
								onFocus={(key) =>
									onFocus(queryParameter.id, key)
								}
								queryParameter={queryParameter}
							/>
						))}
					</tbody>
				</table>
			)}

			<div className="mt-2">
				<ClayButton displayType="secondary" onClick={onAdd} size="sm">
					<span className="inline-item inline-item-before">
						<ClayIcon symbol="plus" />
					</span>

					{Liferay.Language.get('add-parameter')}
				</ClayButton>
			</div>
		</>
	);
}

QueryParametersTable.propTypes = {
	inputRef: PropTypes.func.isRequired,
	onAdd: PropTypes.func.isRequired,
	onChange: PropTypes.func.isRequired,
	onDelete: PropTypes.func.isRequired,
	onFocus: PropTypes.func.isRequired,
	queryParameters: PropTypes.arrayOf(
		PropTypes.shape({
			id: PropTypes.number.isRequired,
			name: PropTypes.string.isRequired,
			value: PropTypes.string.isRequired,
		})
	).isRequired,
};

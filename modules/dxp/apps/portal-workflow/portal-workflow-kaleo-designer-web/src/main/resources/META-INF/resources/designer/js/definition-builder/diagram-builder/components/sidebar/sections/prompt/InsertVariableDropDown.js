/**
 * SPDX-FileCopyrightText: (c) 2026 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import ClayButton from '@clayui/button';
import ClayDropDown from '@clayui/drop-down';
import ClayIcon from '@clayui/icon';
import PropTypes from 'prop-types';
import React, {useState} from 'react';

export default function InsertVariableDropDown({
	onInsert,
	trigger,
	variableGroups,
}) {
	const [search, setSearch] = useState('');

	const filteredVariableGroups = variableGroups
		.map(({label, variables}) => ({
			label,
			variables: variables.filter(({name}) =>
				name.toLowerCase().includes(search.trim().toLowerCase())
			),
		}))
		.filter(({variables}) => variables.length);

	return (
		<ClayDropDown
			closeOnClick
			trigger={
				trigger ?? (
					<ClayButton displayType="secondary" size="sm">
						<span className="inline-item inline-item-before">
							<ClayIcon symbol="code" />
						</span>

						{Liferay.Language.get('insert-variable')}

						<span className="inline-item inline-item-after">
							<ClayIcon symbol="caret-bottom" />
						</span>
					</ClayButton>
				)
			}
		>
			{!!variableGroups.length && (
				<ClayDropDown.Search
					aria-label={Liferay.Language.get('search-variables')}
					onChange={setSearch}
					placeholder={Liferay.Language.get('search-variables')}
					value={search}
				/>
			)}

			<ClayDropDown.ItemList>
				{filteredVariableGroups.length ? (
					filteredVariableGroups.map(({label, variables}) => (
						<ClayDropDown.Group
							header={label}
							key={`${label}_${variables[0].name}`}
						>
							{variables.map((variable) => (
								<ClayDropDown.Item
									aria-label={variable.name}
									className="insert-variable-drop-down-item"
									key={variable.name}
									onClick={() => onInsert(variable)}
								>
									{variable.name}

									<span className="text-secondary">
										{variable.type}
									</span>
								</ClayDropDown.Item>
							))}
						</ClayDropDown.Group>
					))
				) : (
					<ClayDropDown.Item disabled>
						{variableGroups.length
							? Liferay.Language.get('no-results-found')
							: Liferay.Language.get('no-variables-available')}
					</ClayDropDown.Item>
				)}
			</ClayDropDown.ItemList>
		</ClayDropDown>
	);
}

InsertVariableDropDown.propTypes = {
	onInsert: PropTypes.func.isRequired,
	trigger: PropTypes.element,
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
	).isRequired,
};

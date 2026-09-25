/**
 * SPDX-FileCopyrightText: (c) 2026 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import ClayForm, {ClayInput, ClaySelect} from '@clayui/form';
import PropTypes from 'prop-types';
import React, {useId} from 'react';

import {QUERY_TRANSFORMER_KEYS_WITH_COUNT} from './utils';

function getQueryTransformerOptions() {
	return [
		{label: Liferay.Language.get('none'), value: ''},
		{label: Liferay.Language.get('compressing'), value: 'compressing'},
		{label: Liferay.Language.get('expanding'), value: 'expanding'},
		{
			label: Liferay.Language.get('keyword-expanding'),
			value: 'keywordExpanding',
		},
	];
}

export default function QueryTransformerFields({
	chaining,
	expandedQueriesCount,
	onExpandedQueriesCountChange,
	onQueryTransformerKeyChange,
	queryTransformerKey,
}) {
	const expandedQueriesCountId = useId();
	const queryTransformerId = useId();

	const expandedQueriesCountEnabled =
		QUERY_TRANSFORMER_KEYS_WITH_COUNT.includes(queryTransformerKey);

	return (
		<>
			<ClayForm.Group>
				<label htmlFor={queryTransformerId}>
					{Liferay.Language.get('query-transformer')}
				</label>

				<ClaySelect
					disabled={chaining}
					id={queryTransformerId}
					onChange={({target}) =>
						onQueryTransformerKeyChange(target.value)
					}
					value={queryTransformerKey}
				>
					{getQueryTransformerOptions().map(({label, value}) => (
						<ClaySelect.Option
							key={value}
							label={label}
							value={value}
						/>
					))}

					{chaining && (
						<ClaySelect.Option label="chaining" value="chaining" />
					)}
				</ClaySelect>

				{chaining && (
					<ClayForm.Text>
						{Liferay.Language.get(
							'the-chaining-query-transformer-can-only-be-edited-in-the-sidebar'
						)}
					</ClayForm.Text>
				)}
			</ClayForm.Group>

			{expandedQueriesCountEnabled && (
				<ClayForm.Group>
					<label htmlFor={expandedQueriesCountId}>
						{Liferay.Language.get('expanded-queries-count')}
					</label>

					<ClayInput
						aria-describedby={`${expandedQueriesCountId}HelpText`}
						id={expandedQueriesCountId}
						min="1"
						onChange={({target}) =>
							onExpandedQueriesCountChange(target.value)
						}
						type="number"
						value={expandedQueriesCount}
					/>

					<ClayForm.Text id={`${expandedQueriesCountId}HelpText`}>
						{Liferay.Language.get('expanded-queries-count-help')}
					</ClayForm.Text>
				</ClayForm.Group>
			)}
		</>
	);
}

QueryTransformerFields.propTypes = {
	chaining: PropTypes.bool,
	expandedQueriesCount: PropTypes.string.isRequired,
	onExpandedQueriesCountChange: PropTypes.func.isRequired,
	onQueryTransformerKeyChange: PropTypes.func.isRequired,
	queryTransformerKey: PropTypes.string.isRequired,
};

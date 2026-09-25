/**
 * SPDX-FileCopyrightText: (c) 2026 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import ClayForm, {ClayInput} from '@clayui/form';
import classNames from 'classnames';
import PropTypes from 'prop-types';
import React, {useEffect, useId, useState} from 'react';

import {retrieveSearchableAssetNames} from '../../../../../util/fetchUtil';
import MultiValueInput from '../shared-components/MultiValueInput';

// Mirrors the SearchResult DTO of the Liferay search API

const SEARCH_RESULT_FIELDS = [
	'actions',
	'dateCreated',
	'dateModified',
	'dateReview',
	'description',
	'embedded',
	'entryClassName',
	'itemURL',
	'score',
	'title',
];

// Mirrors the sort fields supported by the Liferay search API

const SORT_FIELDS = [
	'dateCreated',
	'dateDisplay',
	'dateExpiration',
	'dateModified',
	'datePublish',
	'dateReview',
	'keywords',
	'title',
];

const toSourceItems = (values) =>
	values.map((value) => ({label: value, value}));

// Covers LiferaySearchContentRetriever._PARAMETER_NAMES, in display order

export function getSearchParameters() {
	return [
		{
			fullWidth: true,
			helpText: Liferay.Language.get(
				'blueprint-external-reference-code-help'
			),
			label: Liferay.Language.get('blueprint-external-reference-code'),
			name: 'blueprintExternalReferenceCode',
		},
		{
			helpText: Liferay.Language.get('entry-class-names-help'),
			label: Liferay.Language.get('entry-class-names'),
			multiple: true,
			name: 'entryClassNames',
		},
		{
			helpText: Liferay.Language.get('scope-help'),
			label: Liferay.Language.get('scope'),
			multiple: true,
			name: 'scope',
		},
		{
			helpText: Liferay.Language.get('search-result-fields-help'),
			label: Liferay.Language.get('fields'),
			multiple: true,
			name: 'fields',
			sourceItems: toSourceItems(SEARCH_RESULT_FIELDS),
		},
		{
			helpText: Liferay.Language.get('restrict-fields-help'),
			label: Liferay.Language.get('restrict-fields'),
			multiple: true,
			name: 'restrictFields',
			sourceItems: toSourceItems(SEARCH_RESULT_FIELDS),
		},
		{
			fullWidth: true,
			helpText: Liferay.Language.get('filter-help'),
			label: Liferay.Language.get('filter'),
			name: 'filter',
		},
		{
			helpText: Liferay.Language.get('sort-help'),
			label: Liferay.Language.get('sort'),
			multiple: true,
			name: 'sort',
			sourceItems: toSourceItems(
				SORT_FIELDS.flatMap((field) => [
					`${field}:asc`,
					`${field}:desc`,
				])
			),
		},
	];
}

function SearchParameterField({
	fullWidth,
	helpText,
	id,
	inputValue,
	label,
	multiple,
	onInputValueChange,
	onValueChange,
	sourceItems,
	value,
}) {
	const helpTextId = `${id}HelpText`;

	return (
		<ClayForm.Group
			className={classNames({
				'rag-editor-modal-field-full-width': fullWidth,
			})}
		>
			<label htmlFor={id}>{label}</label>

			{multiple ? (
				<MultiValueInput
					ariaDescribedBy={helpTextId}
					id={id}
					inputValue={inputValue}
					onChange={onValueChange}
					onInputValueChange={onInputValueChange}
					placeholder={Liferay.Language.get(
						'press-enter-or-type-a-comma-to-add-a-value'
					)}
					sourceItems={sourceItems}
					values={value}
				/>
			) : (
				<ClayInput
					aria-describedby={helpTextId}
					id={id}
					onChange={({target}) => onValueChange(target.value)}
					value={value}
				/>
			)}

			<ClayForm.Text id={helpTextId}>{helpText}</ClayForm.Text>
		</ClayForm.Group>
	);
}

export default function LiferaySearchParameters({
	inputValues,
	onInputValueChange,
	onValueChange,
	values,
}) {
	const idPrefix = useId();

	const [entryClassNameSourceItems, setEntryClassNameSourceItems] = useState(
		[]
	);

	useEffect(() => {
		retrieveSearchableAssetNames(Liferay.ThemeDisplay.getLanguageId())
			.then((response) => {
				if (!response.ok) {
					throw new Error(response.statusText);
				}

				return response.json();
			})
			.then(({items}) =>
				setEntryClassNameSourceItems(
					items.map(({className, displayName}) => ({
						label: displayName || className,
						value: className,
					}))
				)
			)
			.catch((error) => {
				console.error(error);
			});
	}, []);

	return (
		<div className="rag-editor-modal-fields">
			{getSearchParameters().map(({name, sourceItems, ...parameter}) => (
				<SearchParameterField
					{...parameter}
					id={`${idPrefix}${name}`}
					inputValue={inputValues[name]}
					key={name}
					onInputValueChange={(inputValue) =>
						onInputValueChange(name, inputValue)
					}
					onValueChange={(value) => onValueChange(name, value)}
					sourceItems={
						name === 'entryClassNames'
							? entryClassNameSourceItems
							: sourceItems
					}
					value={values[name]}
				/>
			))}
		</div>
	);
}

LiferaySearchParameters.propTypes = {
	inputValues: PropTypes.object.isRequired,
	onInputValueChange: PropTypes.func.isRequired,
	onValueChange: PropTypes.func.isRequired,
	values: PropTypes.object.isRequired,
};

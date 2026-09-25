/**
 * SPDX-FileCopyrightText: (c) 2026 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import ClayMultiSelect from '@clayui/multi-select';
import PropTypes from 'prop-types';
import React from 'react';

export function joinValues(values, inputValue = '') {
	return [...new Set([...values, ...splitValues(inputValue)])].join(',');
}

export function splitValues(value = '') {
	return String(value)
		.split(',')
		.map((item) => item.trim())
		.filter(Boolean);
}

export default function MultiValueInput({
	ariaDescribedBy,
	id,
	inputValue,
	onChange,
	onInputValueChange,
	placeholder,
	sourceItems = [],
	values,
}) {
	const labels = new Map(sourceItems.map(({label, value}) => [value, label]));

	return (
		<ClayMultiSelect
			aria-describedby={ariaDescribedBy}
			id={id}
			items={values.map((value) => ({
				label: labels.get(value) ?? value,
				value,
			}))}
			onChange={onInputValueChange}
			onItemsChange={(items) =>
				onChange([...new Set(items.map(({value}) => value))])
			}
			placeholder={placeholder}
			sourceItems={sourceItems}
			value={inputValue}
		/>
	);
}

MultiValueInput.propTypes = {
	ariaDescribedBy: PropTypes.string,
	id: PropTypes.string,
	inputValue: PropTypes.string.isRequired,
	onChange: PropTypes.func.isRequired,
	onInputValueChange: PropTypes.func.isRequired,
	placeholder: PropTypes.string,
	sourceItems: PropTypes.arrayOf(
		PropTypes.shape({
			label: PropTypes.string.isRequired,
			value: PropTypes.string.isRequired,
		})
	),
	values: PropTypes.arrayOf(PropTypes.string).isRequired,
};

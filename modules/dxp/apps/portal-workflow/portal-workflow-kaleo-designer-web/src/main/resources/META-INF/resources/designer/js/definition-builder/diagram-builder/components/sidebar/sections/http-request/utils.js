/**
 * SPDX-FileCopyrightText: (c) 2026 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

export const HTTP_METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];

export const LIFERAY_DXP_URL_VARIABLE = '{{aiHubCellLiferayDXPURL}}';

const VARIABLES_REGEXP = /\{\{[^{}]+\}\}/g;

// Query parameters are kept as they are because Kaleo replaces the variables
// of the URL without encoding them

export function buildURL(baseURL, queryParameters) {
	const query = queryParameters
		.filter(({name}) => name)
		.map(({hasValue, name, value}) =>
			hasValue || value ? `${name}=${value}` : name
		)
		.join('&');

	return query ? `${baseURL}?${query}` : baseURL;
}

export function isLiferayDXPURL(url) {
	return url.trim().startsWith(LIFERAY_DXP_URL_VARIABLE);
}

export function isValidJSONBody(body) {
	if (!body.trim()) {
		return true;
	}

	try {
		JSON.parse(body.replace(VARIABLES_REGEXP, 'null'));

		return true;
	}
	catch (error) {
		return false;
	}
}

export function parseURL(url = '') {
	const index = url.indexOf('?');

	if (index === -1) {
		return {baseURL: url, queryParameters: []};
	}

	return {
		baseURL: url.slice(0, index),
		queryParameters: url
			.slice(index + 1)
			.split('&')
			.filter(Boolean)
			.map((queryParameter) => {
				const separatorIndex = queryParameter.indexOf('=');

				if (separatorIndex === -1) {
					return {hasValue: false, name: queryParameter, value: ''};
				}

				return {
					hasValue: true,
					name: queryParameter.slice(0, separatorIndex),
					value: queryParameter.slice(separatorIndex + 1),
				};
			}),
	};
}

/**
 * SPDX-FileCopyrightText: (c) 2026 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import {
	buildURL,
	isLiferayDXPURL,
	isValidJSONBody,
	parseURL,
} from '../../../../../../../../../src/main/resources/META-INF/resources/designer/js/definition-builder/diagram-builder/components/sidebar/sections/http-request/utils';

const URL =
	'{{aiHubCellLiferayDXPURL}}/o/search/v1.0/search?filter={{filter}}&nestedFields=embedded&flag';

describe('The HTTP request utils should', () => {
	it('Parse the query parameters of a URL without decoding them', () => {
		expect(parseURL(URL)).toEqual({
			baseURL: '{{aiHubCellLiferayDXPURL}}/o/search/v1.0/search',
			queryParameters: [
				{hasValue: true, name: 'filter', value: '{{filter}}'},
				{hasValue: true, name: 'nestedFields', value: 'embedded'},
				{hasValue: false, name: 'flag', value: ''},
			],
		});
		expect(parseURL('https://liferay.com')).toEqual({
			baseURL: 'https://liferay.com',
			queryParameters: [],
		});
		expect(parseURL(undefined)).toEqual({baseURL: '', queryParameters: []});
	});

	it('Build the same URL from its parsed parts', () => {
		const {baseURL, queryParameters} = parseURL(URL);

		expect(buildURL(baseURL, queryParameters)).toBe(URL);
	});

	it('Ignore the query parameters without a name', () => {
		expect(
			buildURL('https://liferay.com', [
				{hasValue: true, name: '', value: 'ignored'},
				{hasValue: true, name: 'q', value: '{{query}}'},
			])
		).toBe('https://liferay.com?q={{query}}');
		expect(buildURL('https://liferay.com', [])).toBe('https://liferay.com');
	});

	it('Detect the Liferay DXP URLs', () => {
		expect(isLiferayDXPURL(' {{aiHubCellLiferayDXPURL}}/o/c/items')).toBe(
			true
		);
		expect(
			isLiferayDXPURL('https://example.com/{{aiHubCellLiferayDXPURL}}')
		).toBe(false);
	});

	it('Validate the request body as JSON while tolerating variables', () => {
		expect(isValidJSONBody('')).toBe(true);
		expect(isValidJSONBody('{{payload}}')).toBe(true);
		expect(
			isValidJSONBody(
				'{"className": "{{className}}", "count": {{count}}}'
			)
		).toBe(true);
		expect(isValidJSONBody('{"className": }')).toBe(false);
	});
});

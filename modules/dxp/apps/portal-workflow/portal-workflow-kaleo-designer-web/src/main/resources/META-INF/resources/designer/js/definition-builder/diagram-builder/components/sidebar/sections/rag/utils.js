/**
 * SPDX-FileCopyrightText: (c) 2026 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import {joinValues, splitValues} from '../shared-components/MultiValueInput';
import {getSearchParameters} from './LiferaySearchParameters';

// Mirrors ExpandingQueryTransformer.DEFAULT_N

export const DEFAULT_EXPANDED_QUERIES_COUNT = 3;

export const LIFERAY_CONTENT_RETRIEVER_KEY = 'liferay';

export const QUERY_TRANSFORMER_KEYS_WITH_COUNT = [
	'expanding',
	'keywordExpanding',
];

// Mirrors LiferaySearchContentRetriever._PARAMETER_NAMES

const SEARCH_REQUEST_PARAMETER_NAMES = [
	'blueprintExternalReferenceCode',
	'entryClassNames',
	'fields',
	'filter',
	'restrictFields',
	'scope',
	'sort',
];

function createContentRetriever(
	contentRetriever,
	searchParameterValues,
	searchParameterInputValues
) {
	const newContentRetriever = {
		...(contentRetriever?.key === LIFERAY_CONTENT_RETRIEVER_KEY
			? contentRetriever
			: {}),
		key: LIFERAY_CONTENT_RETRIEVER_KEY,
	};

	getSearchParameters().forEach(({multiple, name}) => {
		const value = multiple
			? joinValues(
					searchParameterValues[name],
					searchParameterInputValues[name]
				)
			: searchParameterValues[name].trim();

		if (value) {
			newContentRetriever[name] = value;
		}
		else {
			delete newContentRetriever[name];
		}
	});

	return newContentRetriever;
}

function createQueryTransformer(
	queryTransformer,
	queryTransformerKey,
	expandedQueriesCount
) {
	if (queryTransformer?.key === 'chaining') {
		return queryTransformer;
	}

	if (!queryTransformerKey) {
		return null;
	}

	const newQueryTransformer = {
		...(queryTransformer?.key === queryTransformerKey
			? queryTransformer
			: {}),
		key: queryTransformerKey,
	};

	if (QUERY_TRANSFORMER_KEYS_WITH_COUNT.includes(queryTransformerKey)) {
		newQueryTransformer.expandedQueriesCount =
			Number(expandedQueriesCount) || DEFAULT_EXPANDED_QUERIES_COUNT;
	}
	else {
		delete newQueryTransformer.expandedQueriesCount;
	}

	return newQueryTransformer;
}

export function buildRAG({
	expandedQueriesCount,
	liferaySearchEnabled,
	queryTransformerKey,
	rag,
	searchParameterInputValues,
	searchParameterValues,
}) {
	const {contentRetriever, queryTransformer, ...otherProperties} = rag;

	const newRAG = {...otherProperties};

	if (liferaySearchEnabled) {
		newRAG.contentRetriever = createContentRetriever(
			contentRetriever,
			searchParameterValues,
			searchParameterInputValues
		);
	}

	const newQueryTransformer = createQueryTransformer(
		queryTransformer,
		queryTransformerKey,
		expandedQueriesCount
	);

	if (newQueryTransformer) {
		newRAG.queryTransformer = newQueryTransformer;
	}

	return newRAG;
}

// Mirrors LiferaySearchContentRetriever._search

export function buildSearchRequest(contentRetriever) {
	const parameters = [];

	SEARCH_REQUEST_PARAMETER_NAMES.forEach((name) => {
		let value = contentRetriever[name];

		if (!value) {
			return;
		}

		if (name === 'fields') {
			value = `${value},score,title`;
		}

		parameters.push([name, value]);
	});

	parameters.push(
		['nestedFields', 'embedded'],
		['page', '1'],
		['pageSize', '5'],
		['search', '{query}']
	);

	return [
		'GET /o/search/v1.0/search',
		...parameters.map(
			([name, value], index) => `\t${index ? '&' : '?'}${name}=${value}`
		),
	].join('\n');
}

export function getInitialSearchParameterValues(contentRetriever) {
	const liferayContentRetriever =
		contentRetriever?.key === LIFERAY_CONTENT_RETRIEVER_KEY
			? contentRetriever
			: {};

	return Object.fromEntries(
		getSearchParameters().map(({multiple, name}) => [
			name,
			multiple
				? splitValues(liferayContentRetriever[name])
				: String(liferayContentRetriever[name] ?? ''),
		])
	);
}

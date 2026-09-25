/**
 * SPDX-FileCopyrightText: (c) 2026 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import '@testing-library/jest-dom';
import {render, screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';

import RAGEditorModal from '../../../../../../../../../src/main/resources/META-INF/resources/designer/js/definition-builder/diagram-builder/components/sidebar/sections/rag/RAGEditorModal';

jest.mock(
	'../../../../../../../../../src/main/resources/META-INF/resources/designer/js/definition-builder/util/fetchUtil',
	() => ({
		retrieveSearchableAssetNames: jest.fn(() =>
			Promise.resolve({
				json: () =>
					Promise.resolve({
						items: [
							{
								className:
									'com.liferay.journal.model.JournalArticle',
								displayName: 'Web Content Article',
							},
						],
					}),
				ok: true,
			})
		),
	})
);

const openQueryTransformerSection = async (user) =>
	user.click(await screen.findByRole('button', {name: 'query-transformer'}));

const renderRAGEditorModal = (props = {}) => {
	const onApply = jest.fn();

	render(
		<RAGEditorModal
			onApply={onApply}
			onClose={jest.fn()}
			title="edit-x"
			{...props}
		/>
	);

	return {onApply};
};

describe('The RAGEditorModal component should', () => {
	it('Configure the Liferay search and a query transformer', async () => {
		const user = userEvent.setup();

		const {onApply} = renderRAGEditorModal({initialRAG: {}});

		await user.click(
			await screen.findByRole('checkbox', {name: 'liferay-search'})
		);
		await user.type(
			screen.getByRole('textbox', {
				name: 'blueprint-external-reference-code',
			}),
			' BLUEPRINT '
		);
		await openQueryTransformerSection(user);
		await user.selectOptions(
			screen.getByRole('combobox', {name: 'query-transformer'}),
			'expanding'
		);

		const expandedQueriesCountInput = screen.getByRole('spinbutton', {
			name: 'expanded-queries-count',
		});

		expect(expandedQueriesCountInput).toHaveValue(3);

		await user.clear(expandedQueriesCountInput);
		await user.type(expandedQueriesCountInput, '5');

		await user.click(screen.getByRole('button', {name: 'apply'}));

		expect(onApply).toHaveBeenCalledWith({
			contentRetriever: {
				blueprintExternalReferenceCode: 'BLUEPRINT',
				key: 'liferay',
			},
			queryTransformer: {expandedQueriesCount: 5, key: 'expanding'},
		});
	});

	it('Keep the unknown properties and remove the cleared ones', async () => {
		const user = userEvent.setup();

		const {onApply} = renderRAGEditorModal({
			initialRAG: {
				contentRetriever: {
					blueprintExternalReferenceCode: 'BLUEPRINT',
					custom: 'value',
					key: 'liferay',
					sort: 'title:asc',
				},
				other: true,
				queryTransformer: {key: 'compressing'},
			},
		});

		await user.clear(
			await screen.findByRole('textbox', {
				name: 'blueprint-external-reference-code',
			})
		);
		await openQueryTransformerSection(user);
		await user.selectOptions(
			screen.getByRole('combobox', {name: 'query-transformer'}),
			''
		);

		await user.click(screen.getByRole('button', {name: 'apply'}));

		expect(onApply).toHaveBeenCalledWith({
			contentRetriever: {
				custom: 'value',
				key: 'liferay',
				sort: 'title:asc',
			},
			other: true,
		});
	});

	it('Remove the content retriever when the Liferay search is disabled', async () => {
		const user = userEvent.setup();

		const {onApply} = renderRAGEditorModal({
			initialRAG: {contentRetriever: {key: 'liferay'}},
		});

		await user.click(
			await screen.findByRole('checkbox', {name: 'liferay-search'})
		);

		expect(
			screen.queryByRole('textbox', {
				name: 'blueprint-external-reference-code',
			})
		).not.toBeInTheDocument();

		await user.click(screen.getByRole('button', {name: 'apply'}));

		expect(onApply).toHaveBeenCalledWith({});
	});

	it('Edit the list parameters as multiple values', async () => {
		const user = userEvent.setup();

		const {onApply} = renderRAGEditorModal({
			initialRAG: {contentRetriever: {key: 'liferay', scope: '20121'}},
		});

		const scopeInput = await screen.findByLabelText('scope');

		await user.type(scopeInput, 'L_GUEST{Enter}');
		await user.type(scopeInput, 'L_SPACE');
		await user.tab();

		await user.click(screen.getByRole('button', {name: 'apply'}));

		expect(onApply).toHaveBeenCalledWith({
			contentRetriever: {key: 'liferay', scope: '20121,L_GUEST,L_SPACE'},
		});
	});

	it('Display the entry class names with their display names', async () => {
		renderRAGEditorModal({
			initialRAG: {
				contentRetriever: {
					entryClassNames: 'com.liferay.journal.model.JournalArticle',
					key: 'liferay',
				},
			},
		});

		expect(
			await screen.findByText('Web Content Article')
		).toBeInTheDocument();
	});

	it('Keep the chaining query transformer untouched', async () => {
		const user = userEvent.setup();

		const queryTransformer = {
			key: 'chaining',
			queryTransformers: [{key: 'compressing'}, {key: 'expanding'}],
		};

		const {onApply} = renderRAGEditorModal({
			initialRAG: {queryTransformer},
		});

		await openQueryTransformerSection(user);

		expect(
			screen.getByRole('combobox', {name: 'query-transformer'})
		).toBeDisabled();
		expect(
			screen.getByText(
				'the-chaining-query-transformer-can-only-be-edited-in-the-sidebar'
			)
		).toBeInTheDocument();

		await user.click(screen.getByRole('button', {name: 'apply'}));

		expect(onApply).toHaveBeenCalledWith({queryTransformer});
	});

	it('Preview the search request and the saved configuration', async () => {
		const user = userEvent.setup();

		renderRAGEditorModal({
			initialRAG: {
				contentRetriever: {
					blueprintExternalReferenceCode: 'BLUEPRINT',
					fields: 'itemURL',
					key: 'liferay',
				},
			},
		});

		const searchRequest = await screen.findByText(/GET \/o\/search/);

		expect(searchRequest).toHaveTextContent(
			'?blueprintExternalReferenceCode=BLUEPRINT'
		);
		expect(searchRequest).toHaveTextContent('&fields=itemURL,score,title');
		expect(searchRequest).toHaveTextContent('&pageSize=5');

		await user.click(
			screen.getByRole('checkbox', {name: 'liferay-search'})
		);

		expect(
			screen.getByText('the-liferay-search-is-disabled')
		).toBeInTheDocument();

		await user.click(screen.getByRole('tab', {name: 'json'}));

		expect(screen.getByText('{}')).toBeInTheDocument();
	});

	it('Warn when the current value is not valid JSON', async () => {
		renderRAGEditorModal({initialRAG: '{"contentRetriever"'});

		expect(
			await screen.findByText(
				'the-current-value-is-not-valid-json-and-will-be-replaced'
			)
		).toBeInTheDocument();
	});
});

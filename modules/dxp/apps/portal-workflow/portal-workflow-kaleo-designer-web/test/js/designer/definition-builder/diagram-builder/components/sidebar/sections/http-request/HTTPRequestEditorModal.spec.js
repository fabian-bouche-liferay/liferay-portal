/**
 * SPDX-FileCopyrightText: (c) 2026 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import '@testing-library/jest-dom';
import {render, screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';

import HTTPRequestEditorModal from '../../../../../../../../../src/main/resources/META-INF/resources/designer/js/definition-builder/diagram-builder/components/sidebar/sections/http-request/HTTPRequestEditorModal';

jest.mock(
	'../../../../../../../../../src/main/resources/META-INF/resources/designer/js/definition-builder/diagram-builder/components/sidebar/sections/prompt/PromptCodeMirrorEditor',
	() => require('../../../../../../../../mock/MockPromptCodeMirrorEditor')
);

const URL = '{{aiHubCellLiferayDXPURL}}/o/search/v1.0/search?filter={{filter}}';

const VARIABLE_GROUPS = [
	{
		label: 'agent',
		variables: [{name: 'request', type: 'string'}],
	},
	{
		label: 'workflow',
		variables: [{name: 'aiHubCellLiferayDXPURL', type: 'string'}],
	},
];

const renderHTTPRequestEditorModal = (props = {}) => {
	const onApply = jest.fn();

	render(
		<HTTPRequestEditorModal
			initialHTTPMethod="GET"
			initialInputVariables={[
				{name: 'aiHubCellLiferayDXPURL', type: 'string'},
				{name: 'filter', type: 'string'},
			]}
			initialRequestBody=""
			initialURL={URL}
			onApply={onApply}
			onClose={jest.fn()}
			title="edit-x"
			variableGroups={VARIABLE_GROUPS}
			{...props}
		/>
	);

	return {onApply};
};

describe('The HTTPRequestEditorModal component should', () => {
	it('Edit the request and persist it in the same format', async () => {
		const user = userEvent.setup();

		const {onApply} = renderHTTPRequestEditorModal();

		expect(await screen.findByLabelText('url')).toHaveValue(
			'{{aiHubCellLiferayDXPURL}}/o/search/v1.0/search'
		);

		await user.selectOptions(screen.getByLabelText('http-method'), 'POST');
		await user.click(screen.getByRole('button', {name: 'add-parameter'}));

		const nameInputs = screen.getAllByRole('textbox', {name: 'name'});
		const valueInputs = screen.getAllByRole('textbox', {name: 'value'});

		expect(valueInputs[0]).toHaveValue('{{filter}}');

		await user.type(nameInputs[1], 'pageSize');
		await user.type(valueInputs[1], '5');
		await user.type(
			screen.getByRole('textbox', {name: 'request-body'}),
			'{{"size": 5}'
		);

		await user.click(screen.getByRole('button', {name: 'apply'}));

		expect(onApply).toHaveBeenCalledWith({
			httpMethod: 'POST',
			inputVariables: [
				{name: 'aiHubCellLiferayDXPURL', type: 'string'},
				{name: 'filter', type: 'string'},
			],
			requestBody: '{"size": 5}',
			url: `${URL}&pageSize=5`,
		});
	});

	it('Insert a variable in the last focused field and declare it', async () => {
		const user = userEvent.setup();

		const {onApply} = renderHTTPRequestEditorModal();

		await user.click(
			(await screen.findAllByRole('textbox', {name: 'value'}))[0]
		);
		await user.keyboard('{End}');

		await user.click(screen.getByRole('button', {name: 'insert-variable'}));
		await user.click(
			await screen.findByRole('menuitem', {name: 'request'})
		);

		await user.click(screen.getByRole('textbox', {name: 'request-body'}));
		await user.click(screen.getByRole('button', {name: 'insert-variable'}));
		await user.click(
			await screen.findByRole('menuitem', {name: 'request'})
		);

		await user.click(screen.getByRole('button', {name: 'apply'}));

		expect(onApply).toHaveBeenCalledWith(
			expect.objectContaining({
				inputVariables: [
					{name: 'aiHubCellLiferayDXPURL', type: 'string'},
					{name: 'filter', type: 'string'},
					{name: 'request', type: 'string'},
				],
				requestBody: '{{request}}',
				url: `${URL}{{request}}`,
			})
		);
	});

	it('Filter the variables with the search field', async () => {
		const user = userEvent.setup();

		renderHTTPRequestEditorModal();

		await user.click(
			await screen.findByRole('button', {name: 'insert-variable'})
		);
		await user.type(
			await screen.findByRole('textbox', {name: 'search-variables'}),
			'req'
		);

		expect(
			screen.getByRole('menuitem', {name: 'request'})
		).toBeInTheDocument();
		expect(
			screen.queryByRole('menuitem', {name: 'aiHubCellLiferayDXPURL'})
		).not.toBeInTheDocument();
	});

	it('Warn when the URL is outside Liferay DXP', async () => {
		const user = userEvent.setup();

		renderHTTPRequestEditorModal();

		expect(
			await screen.findByText(
				'requests-are-made-on-behalf-of-the-current-user-the-authorization-header-is-set-automatically'
			)
		).toBeInTheDocument();

		const urlInput = screen.getByLabelText('url');

		await user.clear(urlInput);
		await user.type(urlInput, 'https://example.com/api');

		expect(
			screen.getByText(
				'the-access-token-of-the-current-user-is-sent-with-this-request-only-call-liferay-dxp-or-trusted-services'
			)
		).toBeInTheDocument();
	});

	it('Warn when the request body is not valid JSON', async () => {
		renderHTTPRequestEditorModal({initialRequestBody: '{"size": }'});

		expect(
			await screen.findByText('the-request-body-is-not-valid-json')
		).toBeInTheDocument();
	});
});

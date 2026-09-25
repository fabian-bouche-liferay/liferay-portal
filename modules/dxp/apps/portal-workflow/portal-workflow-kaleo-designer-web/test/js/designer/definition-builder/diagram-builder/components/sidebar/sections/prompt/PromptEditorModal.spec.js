/**
 * SPDX-FileCopyrightText: (c) 2026 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import '@testing-library/jest-dom';
import {render, screen, waitFor} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';

import PromptEditorModal from '../../../../../../../../../src/main/resources/META-INF/resources/designer/js/definition-builder/diagram-builder/components/sidebar/sections/prompt/PromptEditorModal';

jest.mock(
	'../../../../../../../../../src/main/resources/META-INF/resources/designer/js/definition-builder/diagram-builder/components/sidebar/sections/prompt/PromptCodeMirrorEditor',
	() => require('../../../../../../../../mock/MockPromptCodeMirrorEditor')
);

const VARIABLE_GROUPS = [
	{
		label: 'agent',
		variables: [{name: 'request', type: 'string'}],
	},
	{
		label: 'Fetch Product',
		variables: [{name: 'product', type: 'json'}],
	},
];

const renderPromptEditorModal = (props = {}) => {
	const onApply = jest.fn();
	const onClose = jest.fn();

	render(
		<PromptEditorModal
			initialInputVariables={[]}
			initialValue="Answer the question."
			label="user-message"
			onApply={onApply}
			onClose={onClose}
			subtitle="Liferay Search"
			title="edit-x"
			variableGroups={VARIABLE_GROUPS}
			{...props}
		/>
	);

	return {onApply, onClose};
};

describe('The PromptEditorModal component should', () => {
	it('Apply the edited value and close the modal', async () => {
		const user = userEvent.setup();

		const {onApply, onClose} = renderPromptEditorModal();

		expect(await screen.findByText('Liferay Search')).toBeInTheDocument();

		const editor = screen.getByRole('textbox', {name: 'user-message'});

		await user.clear(editor);
		await user.type(editor, 'Be concise.');

		await user.click(screen.getByRole('button', {name: 'apply'}));

		expect(onApply).toHaveBeenCalledWith({
			inputVariables: [],
			value: 'Be concise.',
		});

		await waitFor(() => expect(onClose).toHaveBeenCalled());
	});

	it('Close the modal without applying the changes', async () => {
		const user = userEvent.setup();

		const {onApply, onClose} = renderPromptEditorModal();

		await user.type(
			await screen.findByRole('textbox', {name: 'user-message'}),
			' Be concise.'
		);

		await user.click(screen.getByRole('button', {name: 'cancel'}));

		await waitFor(() => expect(onClose).toHaveBeenCalled());

		expect(onApply).not.toHaveBeenCalled();
	});

	it('Insert a variable and declare it as an input variable', async () => {
		const user = userEvent.setup();

		const {onApply} = renderPromptEditorModal({
			initialInputVariables: [{name: 'request', type: 'string'}],
			initialValue: '',
		});

		await user.click(
			await screen.findByRole('button', {name: 'insert-variable'})
		);

		expect(await screen.findByText('Fetch Product')).toBeInTheDocument();

		await user.click(screen.getByRole('menuitem', {name: 'product'}));

		await user.click(screen.getByRole('button', {name: 'apply'}));

		expect(onApply).toHaveBeenCalledWith({
			inputVariables: [
				{name: 'request', type: 'string'},
				{name: 'product', type: 'json'},
			],
			value: '{{product}}',
		});
	});

	it('Warn about the undeclared variables and declare them', async () => {
		const user = userEvent.setup();

		const {onApply} = renderPromptEditorModal({initialValue: ''});

		await user.type(
			await screen.findByRole('textbox', {name: 'user-message'}),
			'Use {{{{tone}}'
		);

		expect(
			screen.getByText(
				'the-following-variables-are-not-declared-as-input-variables-and-will-not-be-replaced-x'
			)
		).toBeInTheDocument();

		await user.click(
			screen.getByRole('button', {name: 'declare-variables'})
		);

		expect(
			screen.queryByText(
				'the-following-variables-are-not-declared-as-input-variables-and-will-not-be-replaced-x'
			)
		).not.toBeInTheDocument();

		await user.click(screen.getByRole('button', {name: 'apply'}));

		expect(onApply).toHaveBeenCalledWith({
			inputVariables: [{name: 'tone', type: 'string'}],
			value: 'Use {{tone}}',
		});
	});

	it('Leave the input variables untouched when they are not a valid JSON array', async () => {
		const user = userEvent.setup();

		const {onApply} = renderPromptEditorModal({
			initialInputVariables: '[{"name": "request"',
			initialValue: '{{request}}',
		});

		await user.click(
			await screen.findByRole('button', {name: 'insert-variable'})
		);

		await user.click(
			await screen.findByRole('menuitem', {name: 'request'})
		);

		expect(
			screen.queryByText(
				'the-following-variables-are-not-declared-as-input-variables-and-will-not-be-replaced-x'
			)
		).not.toBeInTheDocument();

		await user.click(screen.getByRole('button', {name: 'apply'}));

		expect(onApply).toHaveBeenCalledWith({
			inputVariables: '[{"name": "request"',
			value: '{{request}}{{request}}',
		});
	});

	it('Disable the variables when no variable groups are provided', async () => {
		const user = userEvent.setup();

		const {onApply} = renderPromptEditorModal({
			initialValue: '',
			variableGroups: undefined,
		});

		await user.type(
			await screen.findByRole('textbox', {name: 'user-message'}),
			'Use {{{{tone}}'
		);

		expect(
			screen.queryByRole('button', {name: 'insert-variable'})
		).not.toBeInTheDocument();
		expect(
			screen.queryByText(
				'the-following-variables-are-not-declared-as-input-variables-and-will-not-be-replaced-x'
			)
		).not.toBeInTheDocument();

		await user.click(screen.getByRole('button', {name: 'apply'}));

		expect(onApply).toHaveBeenCalledWith({value: 'Use {{tone}}'});
	});

	it('Explain how the variables work', async () => {
		const user = userEvent.setup();

		renderPromptEditorModal();

		await user.hover(
			await screen.findByRole('button', {name: 'how-variables-work'})
		);

		expect(
			await screen.findByText(
				'output-contains-the-latest-response-of-an-llm-or-ai-hub-agent-node-each-of-these-nodes-overwrites-it'
			)
		).toBeInTheDocument();
	});

	it('Show a message when no variables are available', async () => {
		const user = userEvent.setup();

		renderPromptEditorModal({variableGroups: []});

		await user.click(
			await screen.findByRole('button', {name: 'insert-variable'})
		);

		expect(
			await screen.findByText('no-variables-available')
		).toBeInTheDocument();
	});
});

/**
 * SPDX-FileCopyrightText: (c) 2026 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import '@testing-library/jest-dom';
import {
	render,
	screen,
	waitForElementToBeRemoved,
	within,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';

import PromptSummary from '../../../../../../../../../src/main/resources/META-INF/resources/designer/js/definition-builder/diagram-builder/components/sidebar/sections/prompt/PromptSummary';
import MockDefinitionBuilderContext from '../../../../../../../../mock/MockDefinitionBuilderContext';
import MockDiagramBuilderContext from '../../../../../../../../mock/MockDiagramBuilderContext';

jest.mock(
	'../../../../../../../../../src/main/resources/META-INF/resources/designer/js/definition-builder/diagram-builder/components/sidebar/sections/prompt/PromptCodeMirrorEditor',
	() => require('../../../../../../../../mock/MockPromptCodeMirrorEditor')
);

const selectedNode = {
	data: {
		inputVariables: [],
		label: {en_US: 'Liferay Search'},
		prompt: 'Analyze the retrieved case studies.',
		userMessage: '',
	},
	id: 'liferaySearch',
	type: 'llm',
};

const getOpenEditorButton = (element) =>
	within(element).getByRole('button', {name: 'open-x-editor'});

const renderPromptSummary = () =>
	render(
		<MockDefinitionBuilderContext
			mockAgentInputVariableNames={['request']}
			mockElements={[selectedNode]}
		>
			<MockDiagramBuilderContext mockSelectedNode={selectedNode}>
				<PromptSummary />
			</MockDiagramBuilderContext>
		</MockDefinitionBuilderContext>
	);

describe('The PromptSummary component should', () => {
	it('Edit the prompt in a modal without variables', async () => {
		const user = userEvent.setup();

		renderPromptSummary();

		await user.click(
			getOpenEditorButton(
				screen.getByRole('button', {name: 'prompt'}).parentElement
			)
		);

		const dialog = await screen.findByRole('dialog', {name: 'edit-x'});

		expect(
			within(dialog).queryByRole('button', {name: 'insert-variable'})
		).not.toBeInTheDocument();

		const editor = within(dialog).getByRole('textbox', {name: 'prompt'});

		expect(editor).toHaveValue('Analyze the retrieved case studies.');

		await user.type(editor, ' Be concise.');
		await user.click(within(dialog).getByRole('button', {name: 'apply'}));

		await waitForElementToBeRemoved(dialog);

		expect(
			screen.getByDisplayValue(
				'Analyze the retrieved case studies. Be concise.'
			)
		).toBeInTheDocument();
	});

	it('Edit the user message in a modal with variables', async () => {
		const user = userEvent.setup();

		renderPromptSummary();

		await user.click(
			getOpenEditorButton(
				screen.getByText('user-message', {selector: 'label'})
					.parentElement
			)
		);

		const dialog = await screen.findByRole('dialog', {name: 'edit-x'});

		expect(
			within(dialog).getByRole('textbox', {name: 'user-message'})
		).toHaveValue('');

		await user.click(
			within(dialog).getByRole('button', {name: 'insert-variable'})
		);
		await user.click(
			await screen.findByRole('menuitem', {name: 'request'})
		);
		await user.click(within(dialog).getByRole('button', {name: 'apply'}));

		await waitForElementToBeRemoved(dialog);

		expect(screen.getByRole('textbox', {name: 'user-message'})).toHaveValue(
			'{{request}}'
		);
		expect(
			screen.getByRole('textbox', {name: 'input-variables'})
		).toHaveValue(
			JSON.stringify([{name: 'request', type: 'string'}], null, 2)
		);
	});
});

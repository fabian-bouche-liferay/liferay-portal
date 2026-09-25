/**
 * SPDX-FileCopyrightText: (c) 2026 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import '@testing-library/jest-dom';
import {render, screen, waitFor} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';

import VariablesEditorModal from '../../../../../../../../../src/main/resources/META-INF/resources/designer/js/definition-builder/diagram-builder/components/sidebar/sections/shared-components/VariablesEditorModal';

const renderVariablesEditorModal = (props = {}) => {
	const onApply = jest.fn();
	const onClose = jest.fn();

	render(
		<VariablesEditorModal
			initialVariables={[
				{description: 'User question', name: 'request', type: 'string'},
			]}
			onApply={onApply}
			onClose={onClose}
			title="edit-x"
			{...props}
		/>
	);

	return {onApply, onClose};
};

describe('The VariablesEditorModal component should', () => {
	it('Edit the variables and keep their unknown properties', async () => {
		const user = userEvent.setup();

		const {onApply, onClose} = renderVariablesEditorModal();

		const nameInput = await screen.findByRole('textbox', {name: 'name'});

		await user.clear(nameInput);
		await user.type(nameInput, ' question ');
		await user.selectOptions(
			screen.getByRole('combobox', {name: 'type'}),
			'json'
		);

		await user.click(screen.getByRole('button', {name: 'apply'}));

		expect(onApply).toHaveBeenCalledWith([
			{description: 'User question', name: 'question', type: 'json'},
		]);

		await waitFor(() => expect(onClose).toHaveBeenCalled());
	});

	it('Add and delete variables', async () => {
		const user = userEvent.setup();

		const {onApply} = renderVariablesEditorModal();

		await user.click(
			await screen.findByRole('button', {name: 'add-variable'})
		);

		const nameInputs = screen.getAllByRole('textbox', {name: 'name'});

		await user.type(nameInputs[1], 'tone');

		await user.click(screen.getAllByRole('button', {name: 'delete'})[0]);

		await user.click(screen.getByRole('button', {name: 'apply'}));

		expect(onApply).toHaveBeenCalledWith([{name: 'tone', type: 'string'}]);
	});

	it('Disable the apply button when a name is empty or duplicated', async () => {
		const user = userEvent.setup();

		renderVariablesEditorModal();

		await user.click(
			await screen.findByRole('button', {name: 'add-variable'})
		);

		expect(screen.getByText('this-field-is-required')).toBeInTheDocument();
		expect(screen.getByRole('button', {name: 'apply'})).toBeDisabled();

		await user.type(
			screen.getAllByRole('textbox', {name: 'name'})[1],
			'request'
		);

		expect(
			screen.getByText('variable-names-must-be-unique')
		).toBeInTheDocument();
		expect(screen.getByRole('button', {name: 'apply'})).toBeDisabled();
	});

	it('Fill the name and the type from the variable picker', async () => {
		const user = userEvent.setup();

		const {onApply} = renderVariablesEditorModal({
			initialVariables: [],
			nameHelp: 'input-variable-name-help',
			typeHelp: 'input-variable-type-help',
			variableGroups: [
				{
					label: 'Fetch Product',
					variables: [{name: 'product', type: 'json'}],
				},
			],
		});

		await user.click(
			await screen.findByRole('button', {name: 'add-variable'})
		);

		expect(
			screen.getByRole('img', {name: 'input-variable-name-help'})
		).toBeInTheDocument();
		expect(
			screen.getByRole('img', {name: 'input-variable-type-help'})
		).toBeInTheDocument();

		await user.click(
			screen.getByRole('button', {name: 'select-a-variable'})
		);
		await user.click(
			await screen.findByRole('menuitem', {name: 'product'})
		);

		expect(screen.getByRole('textbox', {name: 'name'})).toHaveValue(
			'product'
		);

		await user.click(screen.getByRole('button', {name: 'apply'}));

		expect(onApply).toHaveBeenCalledWith([{name: 'product', type: 'json'}]);
	});

	it('Warn when the current value is not valid JSON', async () => {
		const user = userEvent.setup();

		const {onApply} = renderVariablesEditorModal({
			info: 'only-the-first-output-variable-receives-the-node-response',
			initialVariables: '[{"name": "request"',
		});

		expect(
			await screen.findByText(
				'the-current-value-is-not-valid-json-and-will-be-replaced'
			)
		).toBeInTheDocument();
		expect(
			screen.getByText(
				'only-the-first-output-variable-receives-the-node-response'
			)
		).toBeInTheDocument();

		await user.click(screen.getByRole('button', {name: 'apply'}));

		expect(onApply).toHaveBeenCalledWith([]);
	});
});

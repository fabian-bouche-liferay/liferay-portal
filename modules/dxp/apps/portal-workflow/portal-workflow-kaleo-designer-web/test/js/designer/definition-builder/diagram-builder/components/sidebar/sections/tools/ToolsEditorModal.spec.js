/**
 * SPDX-FileCopyrightText: (c) 2026 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import '@testing-library/jest-dom';
import {render, screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';

import ToolsEditorModal from '../../../../../../../../../src/main/resources/META-INF/resources/designer/js/definition-builder/diagram-builder/components/sidebar/sections/tools/ToolsEditorModal';
import {retrieveMCPServers} from '../../../../../../../../../src/main/resources/META-INF/resources/designer/js/definition-builder/util/fetchUtil';

jest.mock(
	'../../../../../../../../../src/main/resources/META-INF/resources/designer/js/definition-builder/util/fetchUtil',
	() => ({
		retrieveMCPServers: jest.fn(),
	})
);

const MCP_SERVERS = [
	{
		externalReferenceCode: 'L_LIFERAY_AI_HUB_MCP_SERVER',
		title: 'Liferay',
		url: 'https://mcp.liferay.com',
	},
	{
		externalReferenceCode: 'GITHUB',
		title: 'GitHub',
		url: 'https://mcp.github.com',
	},
];

const renderToolsEditorModal = (props = {}) => {
	const onApply = jest.fn();

	render(
		<ToolsEditorModal
			builtInToolsEnabled
			onApply={onApply}
			onClose={jest.fn()}
			title="edit-x"
			{...props}
		/>
	);

	return {onApply};
};

describe('The ToolsEditorModal component should', () => {
	beforeEach(() => {
		retrieveMCPServers.mockResolvedValue({
			json: () => Promise.resolve({items: MCP_SERVERS}),
			ok: true,
		});
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	it('Select the built-in tools and the MCP servers', async () => {
		const user = userEvent.setup();

		const {onApply} = renderToolsEditorModal({
			initialTools: [
				{
					externalReferenceCode: 'L_LIFERAY_AI_HUB_MCP_SERVER',
					type: 'mcpServer',
				},
			],
		});

		expect(
			await screen.findByRole('checkbox', {name: 'Liferay'})
		).toBeChecked();
		expect(screen.getByText('https://mcp.github.com')).toBeInTheDocument();

		await user.click(screen.getByRole('checkbox', {name: 'Liferay'}));
		await user.click(screen.getByRole('checkbox', {name: 'GitHub'}));
		await user.click(
			screen.getByRole('checkbox', {name: 'image-generation'})
		);

		await user.click(screen.getByRole('button', {name: 'apply'}));

		expect(onApply).toHaveBeenCalledWith([
			{externalReferenceCode: 'GITHUB', type: 'mcpServer'},
			{externalReferenceCode: 'L_IMAGE_GENERATION', type: 'tool'},
		]);
	});

	it('Keep the unknown tools with their properties', async () => {
		const user = userEvent.setup();

		const unknownTool = {
			custom: 'value',
			externalReferenceCode: 'DELETED_MCP_SERVER',
			type: 'mcpServer',
		};

		const {onApply} = renderToolsEditorModal({
			builtInToolsEnabled: false,
			initialTools: [unknownTool],
		});

		expect(
			await screen.findByRole('checkbox', {name: 'DELETED_MCP_SERVER'})
		).toBeChecked();
		expect(screen.getByText('unknown')).toBeInTheDocument();
		expect(
			screen.queryByRole('checkbox', {name: 'image-generation'})
		).not.toBeInTheDocument();

		await user.click(screen.getByRole('button', {name: 'apply'}));

		expect(onApply).toHaveBeenCalledWith([unknownTool]);
	});

	it('Show an error when the MCP servers cannot be loaded', async () => {
		jest.spyOn(console, 'error').mockImplementation(() => {});

		retrieveMCPServers.mockResolvedValue({ok: false, statusText: 'Error'});

		renderToolsEditorModal();

		expect(
			await screen.findByText('an-unexpected-error-occurred')
		).toBeInTheDocument();

		console.error.mockRestore();
	});

	it('Show a message when there are no MCP servers', async () => {
		retrieveMCPServers.mockResolvedValue({
			json: () => Promise.resolve({items: []}),
			ok: true,
		});

		renderToolsEditorModal();

		expect(
			await screen.findByText('no-mcp-servers-were-found')
		).toBeInTheDocument();
	});
});

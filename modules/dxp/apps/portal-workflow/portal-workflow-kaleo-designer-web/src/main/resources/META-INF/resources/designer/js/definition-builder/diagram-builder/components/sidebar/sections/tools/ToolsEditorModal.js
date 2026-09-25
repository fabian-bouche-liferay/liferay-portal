/**
 * SPDX-FileCopyrightText: (c) 2026 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import ClayAlert from '@clayui/alert';
import ClayForm, {ClayCheckbox} from '@clayui/form';
import ClayLoadingIndicator from '@clayui/loading-indicator';
import PropTypes from 'prop-types';
import React, {useEffect, useState} from 'react';

import {retrieveMCPServers} from '../../../../../util/fetchUtil';
import EditorModal from '../shared-components/EditorModal';

const MCP_SERVER_TYPE = 'mcpServer';

const TOOL_TYPE = 'tool';

function getBuiltInTools() {
	return [
		{
			externalReferenceCode: 'L_IMAGE_GENERATION',
			label: Liferay.Language.get('image-generation'),
			type: TOOL_TYPE,
		},
	];
}

function getToolKey({externalReferenceCode, type}) {
	return `${type}_${externalReferenceCode}`;
}

function ToolCheckbox({checked, description, label, onChange}) {
	return (
		<ClayForm.Group className="mb-2">
			<ClayCheckbox checked={checked} label={label} onChange={onChange} />

			{description && <ClayForm.Text>{description}</ClayForm.Text>}
		</ClayForm.Group>
	);
}

function ToolsFieldset({children, legend}) {
	return (
		<fieldset className="mb-3">
			<legend className="sheet-tertiary-title">{legend}</legend>

			{children}
		</fieldset>
	);
}

export default function ToolsEditorModal({
	builtInToolsEnabled,
	initialTools,
	onApply,
	onClose,
	subtitle,
	title,
}) {
	const invalidInitialTools =
		initialTools !== undefined && !Array.isArray(initialTools);

	const tools = Array.isArray(initialTools) ? initialTools : [];

	const [mcpServers, setMCPServers] = useState(null);
	const [mcpServersError, setMCPServersError] = useState(false);
	const [selectedToolKeys, setSelectedToolKeys] = useState(
		() => new Set(tools.map(getToolKey))
	);

	useEffect(() => {
		retrieveMCPServers()
			.then((response) => {
				if (!response.ok) {
					throw new Error(response.statusText);
				}

				return response.json();
			})
			.then(({items}) => setMCPServers(items))
			.catch((error) => {
				console.error(error);

				setMCPServersError(true);
			});
	}, []);

	const builtInTools = builtInToolsEnabled ? getBuiltInTools() : [];

	const mcpServerTools = (mcpServers ?? []).map(
		({externalReferenceCode, title: mcpServerTitle, url}) => ({
			description: url,
			externalReferenceCode,
			label: mcpServerTitle,
			type: MCP_SERVER_TYPE,
		})
	);

	const knownToolKeys = new Set(
		[...builtInTools, ...mcpServerTools].map(getToolKey)
	);

	// Wait for the MCP servers to load before flagging a tool as unknown

	const unknownTools =
		mcpServers || mcpServersError
			? tools.filter((tool) => !knownToolKeys.has(getToolKey(tool)))
			: [];

	const toggleTool = (tool) =>
		setSelectedToolKeys((previousSelectedToolKeys) => {
			const toolKey = getToolKey(tool);

			const nextSelectedToolKeys = new Set(previousSelectedToolKeys);

			if (nextSelectedToolKeys.has(toolKey)) {
				nextSelectedToolKeys.delete(toolKey);
			}
			else {
				nextSelectedToolKeys.add(toolKey);
			}

			return nextSelectedToolKeys;
		});

	const handleApply = () => {
		const toolsByKey = new Map(
			[...builtInTools, ...mcpServerTools].map(
				({externalReferenceCode, type}) => [
					getToolKey({externalReferenceCode, type}),
					{externalReferenceCode, type},
				]
			)
		);

		tools.forEach((tool) => toolsByKey.set(getToolKey(tool), tool));

		onApply(
			[...selectedToolKeys]
				.filter((toolKey) => toolsByKey.has(toolKey))
				.map((toolKey) => toolsByKey.get(toolKey))
		);
	};

	const renderToolCheckbox = (tool) => (
		<ToolCheckbox
			checked={selectedToolKeys.has(getToolKey(tool))}
			description={tool.description}
			key={getToolKey(tool)}
			label={tool.label ?? tool.externalReferenceCode}
			onChange={() => toggleTool(tool)}
		/>
	);

	return (
		<EditorModal
			className="tools-editor-modal"
			onApply={handleApply}
			onClose={onClose}
			subtitle={subtitle}
			title={title}
		>
			{invalidInitialTools && (
				<ClayAlert displayType="warning">
					{Liferay.Language.get(
						'the-current-value-is-not-valid-json-and-will-be-replaced'
					)}
				</ClayAlert>
			)}

			{!!builtInTools.length && (
				<ToolsFieldset legend={Liferay.Language.get('built-in-tools')}>
					{builtInTools.map(renderToolCheckbox)}
				</ToolsFieldset>
			)}

			<ToolsFieldset legend={Liferay.Language.get('mcp-servers')}>
				{!mcpServers && !mcpServersError && (
					<ClayLoadingIndicator displayType="secondary" size="sm" />
				)}

				{mcpServersError && (
					<ClayAlert displayType="danger">
						{Liferay.Language.get('an-unexpected-error-occurred')}
					</ClayAlert>
				)}

				{mcpServers && !mcpServerTools.length && (
					<p className="text-secondary">
						{Liferay.Language.get('no-mcp-servers-were-found')}
					</p>
				)}

				{mcpServerTools.map(renderToolCheckbox)}
			</ToolsFieldset>

			{!!unknownTools.length && (
				<ToolsFieldset legend={Liferay.Language.get('unknown')}>
					{unknownTools.map(renderToolCheckbox)}
				</ToolsFieldset>
			)}
		</EditorModal>
	);
}

ToolsEditorModal.propTypes = {
	builtInToolsEnabled: PropTypes.bool,
	initialTools: PropTypes.oneOfType([PropTypes.array, PropTypes.string]),
	onApply: PropTypes.func.isRequired,
	onClose: PropTypes.func.isRequired,
	subtitle: PropTypes.string,
	title: PropTypes.string.isRequired,
};

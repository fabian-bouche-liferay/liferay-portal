/**
 * SPDX-FileCopyrightText: (c) 2000 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import ClayForm, {ClayInput} from '@clayui/form';
import {sub} from 'frontend-js-web';
import PropTypes from 'prop-types';
import React, {useContext, useMemo, useState} from 'react';

import {defaultLanguageId} from '../../../../../constants';
import {DiagramBuilderContext} from '../../../../DiagramBuilderContext';
import {
	formatVariablesForTextarea,
	parseVariablesInput,
} from '../../../../util/parseVariables';
import SidebarPanel from '../../SidebarPanel';
import OpenEditorButton from '../shared-components/OpenEditorButton';
import ToolsEditorModal from './ToolsEditorModal';

const ToolsSummary = () => {
	const {selectedItem, setSelectedItem} = useContext(DiagramBuilderContext);

	const [showToolsEditorModal, setShowToolsEditorModal] = useState(false);

	const tools = useMemo(
		() => formatVariablesForTextarea(selectedItem?.data?.tools, '[]'),
		[selectedItem]
	);

	const onToolsChanges =
		() =>
		({target}) => {
			if (!selectedItem) {
				return;
			}

			const text = target.value;
			const parsed = parseVariablesInput(text);

			const updatedItem = {
				...selectedItem,
				data: {
					...selectedItem.data,
					['tools']: parsed,
				},
			};

			setSelectedItem(updatedItem);
		};

	return (
		<SidebarPanel
			headerActions={
				<OpenEditorButton
					label={Liferay.Language.get('tools')}
					onClick={() => setShowToolsEditorModal(true)}
				/>
			}
			panelTitle={Liferay.Language.get('tools')}
		>
			<ClayForm.Group>
				<ClayInput
					component="textarea"
					onChange={onToolsChanges()}
					placeholder='[{"externalReferenceCode":"L_LIFERAY_AI_HUB_MCP_SERVER", "type":"mcpServer"}]'
					type="text"
					value={tools}
				/>
			</ClayForm.Group>

			{showToolsEditorModal && (
				<ToolsEditorModal
					builtInToolsEnabled={selectedItem?.type === 'llm'}
					initialTools={selectedItem?.data.tools}
					onApply={(newTools) =>
						setSelectedItem((previousSelectedItem) => ({
							...previousSelectedItem,
							data: {
								...previousSelectedItem.data,
								tools: newTools,
							},
						}))
					}
					onClose={() => setShowToolsEditorModal(false)}
					subtitle={selectedItem?.data.label?.[defaultLanguageId]}
					title={sub(
						Liferay.Language.get('edit-x'),
						Liferay.Language.get('tools')
					)}
				/>
			)}
		</SidebarPanel>
	);
};

ToolsSummary.propTypes = {
	setContentName: PropTypes.func.isRequired,
};

export default ToolsSummary;

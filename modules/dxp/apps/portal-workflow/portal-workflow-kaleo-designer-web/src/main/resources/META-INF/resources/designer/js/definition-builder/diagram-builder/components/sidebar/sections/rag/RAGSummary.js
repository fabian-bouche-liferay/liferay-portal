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
import RAGEditorModal from './RAGEditorModal';

const RAGSummary = () => {
	const {selectedItem, setSelectedItem} = useContext(DiagramBuilderContext);

	const [showRAGEditorModal, setShowRAGEditorModal] = useState(false);

	const rag = useMemo(
		() => formatVariablesForTextarea(selectedItem?.data?.rag),
		[selectedItem]
	);

	const onRAGChanges =
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
					['rag']: parsed,
				},
			};

			setSelectedItem(updatedItem);
		};

	return (
		<SidebarPanel
			headerActions={
				<OpenEditorButton
					label={Liferay.Language.get(
						'retrieval-augmented-generation'
					)}
					onClick={() => setShowRAGEditorModal(true)}
				/>
			}
			panelTitle={Liferay.Language.get('retrieval-augmented-generation')}
		>
			<ClayForm.Group>
				<ClayInput
					component="textarea"
					onChange={onRAGChanges()}
					placeholder='{"contentRetriever": {"key": "liferay", "blueprintExternalReferenceCode": "BLUEPRINT_EXTERNAL_REFERENCE_CODE"}}'
					type="text"
					value={rag}
				/>
			</ClayForm.Group>

			{showRAGEditorModal && (
				<RAGEditorModal
					initialRAG={selectedItem?.data.rag}
					onApply={(newRAG) =>
						setSelectedItem((previousSelectedItem) => ({
							...previousSelectedItem,
							data: {
								...previousSelectedItem.data,
								rag: newRAG,
							},
						}))
					}
					onClose={() => setShowRAGEditorModal(false)}
					subtitle={selectedItem?.data.label?.[defaultLanguageId]}
					title={sub(
						Liferay.Language.get('edit-x'),
						Liferay.Language.get('retrieval-augmented-generation')
					)}
				/>
			)}
		</SidebarPanel>
	);
};

RAGSummary.propTypes = {
	setContentName: PropTypes.func.isRequired,
};

export default RAGSummary;

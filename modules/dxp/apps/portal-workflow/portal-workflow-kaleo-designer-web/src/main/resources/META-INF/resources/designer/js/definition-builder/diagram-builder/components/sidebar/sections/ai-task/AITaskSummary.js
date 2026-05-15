/**
 * SPDX-FileCopyrightText: (c) 2000 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import ClayForm, {ClayInput} from '@clayui/form';
import PropTypes from 'prop-types';
import React, {useContext} from 'react';

import {DiagramBuilderContext} from '../../../../DiagramBuilderContext';
import SidebarPanel from '../../SidebarPanel';

const AITaskSummary = () => {
	const {selectedItem, setSelectedItem} = useContext(DiagramBuilderContext);

	const updateData = (field, value) => {
		if (!selectedItem) {
			return;
		}

		setSelectedItem({
			...selectedItem,
			data: {
				...selectedItem.data,
				[field]: value,
			},
		});
	};

	return (
		<SidebarPanel panelTitle={Liferay.Language.get('ai-task')}>
			<ClayForm.Group>
				<label htmlFor="remoteLiferayBaseURL">
					{Liferay.Language.get('remote-liferay-base-url')}
				</label>

				<ClayInput
					id="remoteLiferayBaseURL"
					onChange={({target}) =>
						updateData('remoteLiferayBaseURL', target.value)
					}
					type="text"
					value={selectedItem?.data.remoteLiferayBaseURL ?? ''}
				/>

				<label className="mt-4" htmlFor="oauth2ClientExternalReferenceCode">
					{Liferay.Language.get(
						'oauth2-client-external-reference-code'
					)}
				</label>

				<ClayInput
					id="oauth2ClientExternalReferenceCode"
					onChange={({target}) =>
						updateData(
							'oauth2ClientExternalReferenceCode',
							target.value
						)
					}
					type="text"
					value={
						selectedItem?.data.oauth2ClientExternalReferenceCode ??
						''
					}
				/>

				<label
					className="mt-4"
					htmlFor="aiTaskDefinitionExternalReferenceCode"
				>
					{Liferay.Language.get(
						'ai-task-definition-external-reference-code'
					)}
				</label>

				<ClayInput
					id="aiTaskDefinitionExternalReferenceCode"
					onChange={({target}) =>
						updateData(
							'aiTaskDefinitionExternalReferenceCode',
							target.value
						)
					}
					type="text"
					value={
						selectedItem?.data
							.aiTaskDefinitionExternalReferenceCode ?? ''
					}
				/>

				<label className="mt-4" htmlFor="timeout">
					{Liferay.Language.get('timeout')}
				</label>

				<ClayInput
					id="timeout"
					min="0"
					onChange={({target}) =>
						updateData(
							'timeout',
							target.value ? Number(target.value) : undefined
						)
					}
					type="number"
					value={selectedItem?.data.timeout ?? ''}
				/>
			</ClayForm.Group>
		</SidebarPanel>
	);
};

AITaskSummary.propTypes = {
	setContentName: PropTypes.func.isRequired,
};

export default AITaskSummary;
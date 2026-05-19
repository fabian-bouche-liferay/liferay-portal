/**
 * SPDX-FileCopyrightText: (c) 2000 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import ClayForm, {ClayInput} from '@clayui/form';
import PropTypes from 'prop-types';
import React, {useMemo, useContext} from 'react';

import {DiagramBuilderContext} from '../../../../DiagramBuilderContext';
import SidebarPanel from '../../SidebarPanel';

const formatMappingsForTextarea = (mappings) => {
	if (!mappings) {
		return '';
	}

	try {
		return JSON.stringify(mappings, null, 2);
	}
	catch (error) {
		return '';
	}
};

const parseMappingsInput = (text) => {
	try {
		return JSON.parse(text || '[]');
	}
	catch (error) {
		return [];
	}
};

const HTTPCallSummary = () => {
	const {selectedItem, setSelectedItem} = useContext(DiagramBuilderContext);

	const inputMappingsValue = useMemo(
		() => formatMappingsForTextarea(selectedItem?.data?.inputMappings),
		[selectedItem]
	);
	
	const outputMappingsValue = useMemo(
		() => formatMappingsForTextarea(selectedItem?.data?.outputMappings),
		[selectedItem]
	);

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
				<label htmlFor="baseURL">
					{Liferay.Language.get('base-url')}
				</label>

				<ClayInput
					id="baseURL"
					onChange={({target}) =>
						updateData('baseURL', target.value)
					}
					type="text"
					value={selectedItem?.data.baseURL ?? ''}
				/>

				<label htmlFor="urlQuery">
					{Liferay.Language.get('url-query')}
				</label>

				<ClayInput
					id="urlQuery"
					onChange={({target}) =>
						updateData('urlQuery', target.value)
					}
					type="text"
					value={selectedItem?.data.urlQuery ?? ''}
				/>

				<label htmlFor="httpBody">
					{Liferay.Language.get('http-body')}
				</label>

				<ClayInput
					id="httpBody"
					component="textarea"
					onChange={({target}) =>
						updateData('httpBody', target.value)
					}
					type="text"
					value={selectedItem?.data.httpBody ?? ''}
				/>

				<label htmlFor="httpMethod">
					{Liferay.Language.get('http-method')}
				</label>

				<ClayInput
					id="httpMethod"
					onChange={({target}) =>
						updateData('httpMethod', target.value)
					}
					type="text"
					value={selectedItem?.data.httpMethod ?? ''}
				/>

				<label className="mt-4" htmlFor="timeout">
					{Liferay.Language.get('inputMappings')}
				</label>
				
				<ClayInput
					id="inputMappings"
					component="textarea"
					onChange={({target}) =>
						setSelectedItem({
							...selectedItem,
							data: {
								...selectedItem.data,
								inputMappings: parseMappingsInput(
									target.value
								),
							},
						})
					}
					placeholder='[{"source":"workflowContext.className","target":"input.className"}]'
					type="text"
					value={inputMappingsValue}
				/>	
				
				<label className="mt-4" htmlFor="timeout">
					{Liferay.Language.get('outputMappings')}
				</label>
				
				<ClayInput
					id="outputMappings"
					component="textarea"
					onChange={({target}) =>
						setSelectedItem({
							...selectedItem,
							data: {
								...selectedItem.data,
								outputMappings: parseMappingsInput(
									target.value
								),
							},
						})
					}
					placeholder='[{"source":"output.response","target":"workflowContext.httpCallResponse"}]'
					type="text"
					value={outputMappingsValue}
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

HTTPCallSummary.propTypes = {
	setContentName: PropTypes.func.isRequired,
};

export default HTTPCallSummary;
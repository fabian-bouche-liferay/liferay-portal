import ClayForm, {ClayInput} from '@clayui/form';
import PropTypes from 'prop-types';
import React, {useContext, useMemo} from 'react';

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

const InputMappingsSummary = () => {
	const {selectedItem, setSelectedItem} = useContext(DiagramBuilderContext);

	const inputMappingsValue = useMemo(
		() => formatMappingsForTextarea(selectedItem?.data?.inputMappings),
		[selectedItem]
	);

	return (
		<SidebarPanel panelTitle={Liferay.Language.get('input-mappings')}>
			<ClayForm.Group>
				<ClayInput
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
			</ClayForm.Group>
		</SidebarPanel>
	);
};

InputMappingsSummary.propTypes = {
	setContentName: PropTypes.func.isRequired,
};

export default InputMappingsSummary;
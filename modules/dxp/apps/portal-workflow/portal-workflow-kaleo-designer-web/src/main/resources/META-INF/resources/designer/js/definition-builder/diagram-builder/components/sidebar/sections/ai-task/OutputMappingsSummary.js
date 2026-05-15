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

const OutputMappingsSummary = () => {
	const {selectedItem, setSelectedItem} = useContext(DiagramBuilderContext);

	const outputMappingsValue = useMemo(
		() => formatMappingsForTextarea(selectedItem?.data?.outputMappings),
		[selectedItem]
	);

	return (
		<SidebarPanel panelTitle={Liferay.Language.get('output-mappings')}>
			<ClayForm.Group>
				<ClayInput
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
					placeholder='[{"source":"output.decision","target":"workflowContext.aiDecision"}]'
					type="text"
					value={outputMappingsValue}
				/>
			</ClayForm.Group>
		</SidebarPanel>
	);
};

OutputMappingsSummary.propTypes = {
	setContentName: PropTypes.func.isRequired,
};

export default OutputMappingsSummary;
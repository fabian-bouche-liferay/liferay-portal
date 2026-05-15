/**
 * SPDX-FileCopyrightText: (c) 2000 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import PropTypes from 'prop-types';
import React from 'react';

import {defaultLanguageId} from '../../../constants';
import BaseNode from './BaseNode';

export default function AITaskNode({
	data: {
		aiTaskDefinitionExternalReferenceCode,
		description,
		inputMappings,
		label,
		newNode,
		oauth2ClientExternalReferenceCode,
		outputMappings,
		remoteLiferayBaseURL,
		timeout,
	} = {},
	descriptionSidebar,
	id,
	...otherProps
}) {
	if (!label || !label[defaultLanguageId]) {
		label = {
			[defaultLanguageId]: Liferay.Language.get('ai-task-node'),
		};
	}

	return (
		<BaseNode
			aiTaskDefinitionExternalReferenceCode={
				aiTaskDefinitionExternalReferenceCode
			}
			description={description}
			descriptionSidebar={descriptionSidebar}
			icon="stars"
			id={id}
			inputMappings={inputMappings}
			label={label}
			newNode={newNode}
			nodeTypeClassName="ai-task-node"
			oauth2ClientExternalReferenceCode={
				oauth2ClientExternalReferenceCode
			}
			outputMappings={outputMappings}
			remoteLiferayBaseURL={remoteLiferayBaseURL}
			timeout={timeout}
			type="ai-task"
			{...otherProps}
		/>
	);
}

AITaskNode.propTypes = {
	data: PropTypes.shape({
		aiTaskDefinitionExternalReferenceCode: PropTypes.string,
		description: PropTypes.object,
		inputMappings: PropTypes.arrayOf(
			PropTypes.shape({
				source: PropTypes.string,
				target: PropTypes.string,
			})
		),
		label: PropTypes.object,
		newNode: PropTypes.bool,
		oauth2ClientExternalReferenceCode: PropTypes.string,
		outputMappings: PropTypes.arrayOf(
			PropTypes.shape({
				source: PropTypes.string,
				target: PropTypes.string,
			})
		),
		remoteLiferayBaseURL: PropTypes.string,
		timeout: PropTypes.number,
	}),
	descriptionSidebar: PropTypes.string,
	id: PropTypes.string,
};

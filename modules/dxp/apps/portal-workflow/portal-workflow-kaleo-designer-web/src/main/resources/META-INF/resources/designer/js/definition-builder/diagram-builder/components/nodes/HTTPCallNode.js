/**
 * SPDX-FileCopyrightText: (c) 2000 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import PropTypes from 'prop-types';
import React from 'react';

import {defaultLanguageId} from '../../../constants';
import BaseNode from './BaseNode';

export default function HTTPCallNode({
	data: {
		baseURL,
		description,
		httpBody,
		httpMethod,
		inputMappings,
		label,
		newNode,
		outputMappings,
		timeout,
		urlQuery,
	} = {},
	descriptionSidebar,
	id,
	...otherProps
}) {
	if (!label || !label[defaultLanguageId]) {
		label = {
			[defaultLanguageId]: Liferay.Language.get('http-call-node'),
		};
	}

	return (
		<BaseNode
			description={description}
			descriptionSidebar={descriptionSidebar}
			icon="stars"
			id={id}
			inputMappings={inputMappings}
			label={label}
			newNode={newNode}
			nodeTypeClassName="http-call-node"
			outputMappings={outputMappings}
			baseURL={baseURL}
			urlQuery={urlQuery}
			httpBody={httpBody}
			httpMethod={httpMethod}
			timeout={timeout}
			type="http-call"
			{...otherProps}
		/>
	);
}

HTTPCallNode.propTypes = {
	data: PropTypes.shape({
		baseURL: PropTypes.string,
		description: PropTypes.object,
		httpBody: PropTypes.string,
		httpMethod: PropTypes.string,
		inputMappings: PropTypes.arrayOf(
			PropTypes.shape({
				source: PropTypes.string,
				target: PropTypes.string,
			})
		),
		label: PropTypes.object,
		newNode: PropTypes.bool,
		outputMappings: PropTypes.arrayOf(
			PropTypes.shape({
				source: PropTypes.string,
				target: PropTypes.string,
			})
		),
		timeout: PropTypes.number,
		urlQuery: PropTypes.string,
	}),
	descriptionSidebar: PropTypes.string,
	id: PropTypes.string,
};

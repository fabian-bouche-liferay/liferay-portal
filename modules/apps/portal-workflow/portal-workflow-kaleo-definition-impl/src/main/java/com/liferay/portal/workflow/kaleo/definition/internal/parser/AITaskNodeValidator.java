/**
 * SPDX-FileCopyrightText: (c) 2025 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

package com.liferay.portal.workflow.kaleo.definition.internal.parser;

import com.liferay.portal.workflow.kaleo.definition.AITask;
import com.liferay.portal.workflow.kaleo.definition.Definition;
import com.liferay.portal.workflow.kaleo.definition.NodeType;
import com.liferay.portal.workflow.kaleo.definition.exception.KaleoDefinitionValidationException;
import com.liferay.portal.workflow.kaleo.definition.parser.NodeValidator;

import org.osgi.service.component.annotations.Component;

/**
 * @author Fabian Bouché
 */
@Component(service = NodeValidator.class)
public class AITaskNodeValidator extends BaseNodeValidator<AITask> {

	@Override
	public NodeType getNodeType() {
		return NodeType.AI_TASK;
	}

	@Override
	protected void doValidate(Definition definition, AITask aiTask)
		throws KaleoDefinitionValidationException {

	}

}

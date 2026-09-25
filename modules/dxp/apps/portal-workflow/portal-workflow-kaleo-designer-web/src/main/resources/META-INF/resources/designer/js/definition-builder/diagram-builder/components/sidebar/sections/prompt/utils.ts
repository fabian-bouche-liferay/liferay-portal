/**
 * SPDX-FileCopyrightText: (c) 2026 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import {isNode} from 'react-flow-renderer';

import {defaultLanguageId} from '../../../../../constants';

import type {Elements} from 'react-flow-renderer';

export interface Variable {
	name: string;
	type: string;
}

export interface VariableGroup {
	label: string;
	variables: Variable[];
}

export const DEFAULT_VARIABLE_TYPE = 'string';

// Only the first output variable of these node types is written into the
// workflow context

const DECLARED_OUTPUT_VARIABLE_NODE_TYPES = ['http-request', 'llm'];

// Node types that set aiHubCellLiferayDXPURL before they run

const LIFERAY_DXP_URL_NODE_TYPES = ['http-request', 'service'];

// Variables that these node types always write into the workflow context

const NODE_TYPE_VARIABLE_NAMES: Record<string, string[]> = {
	'ai-decision': ['reason'],
	'ai-hub-agent': ['output'],
	'llm': ['output'],
};

const VARIABLE_REGEXP = /\{\{([^{}]+)\}\}/g;

function getNodeVariables({
	data,
	type,
}: {
	data?: {outputVariables?: unknown};
	type?: string;
}) {
	const variables: Variable[] = [];

	const outputVariables = data?.outputVariables;

	if (
		DECLARED_OUTPUT_VARIABLE_NODE_TYPES.includes(type ?? '') &&
		Array.isArray(outputVariables) &&
		outputVariables[0]?.name
	) {
		variables.push({
			name: outputVariables[0].name,
			type: outputVariables[0].type || DEFAULT_VARIABLE_TYPE,
		});
	}

	(NODE_TYPE_VARIABLE_NAMES[type ?? ''] ?? []).forEach((name) => {
		if (!variables.some((variable) => variable.name === name)) {
			variables.push({name, type: DEFAULT_VARIABLE_TYPE});
		}
	});

	return variables;
}

export function addInputVariables(
	inputVariables: Variable[],
	variables: Variable[]
) {
	const names = new Set(inputVariables.map(({name}) => name));

	return [
		...inputVariables,
		...variables.filter(({name}) => {
			if (names.has(name)) {
				return false;
			}

			names.add(name);

			return true;
		}),
	];
}

export function getAvailableVariableGroups({
	agentInputVariableNames = [],
	elements = [],
	inputVariables,
	selectedItemId,
}: {
	agentInputVariableNames?: string[];
	elements?: Elements;
	inputVariables?: unknown;
	selectedItemId?: string;
}) {
	const variableGroups: VariableGroup[] = [];

	if (agentInputVariableNames.length) {
		variableGroups.push({
			label: Liferay.Language.get('agent'),
			variables: agentInputVariableNames.map((name) => ({
				name,
				type: DEFAULT_VARIABLE_TYPE,
			})),
		});
	}

	elements.forEach((element) => {
		if (!isNode(element) || element.id === selectedItemId) {
			return;
		}

		const variables = getNodeVariables(element);

		if (variables.length) {
			variableGroups.push({
				label: element.data?.label?.[defaultLanguageId] || element.id,
				variables,
			});
		}
	});

	if (
		elements.some(
			(element) =>
				isNode(element) &&
				LIFERAY_DXP_URL_NODE_TYPES.includes(element.type ?? '')
		)
	) {
		variableGroups.push({
			label: Liferay.Language.get('workflow'),
			variables: [
				{name: 'aiHubCellLiferayDXPURL', type: DEFAULT_VARIABLE_TYPE},
			],
		});
	}

	if (Array.isArray(inputVariables)) {
		const names = new Set(
			variableGroups.flatMap(({variables}) =>
				variables.map(({name}) => name)
			)
		);

		const otherInputVariables = inputVariables.filter(
			(inputVariable) =>
				inputVariable?.name && !names.has(inputVariable.name)
		);

		if (otherInputVariables.length) {
			variableGroups.push({
				label: Liferay.Language.get('input-variables'),
				variables: otherInputVariables,
			});
		}
	}

	return variableGroups;
}

export function getConsumedVariableGroups({
	elements = [],
	selectedItemId,
}: {
	elements?: Elements;
	selectedItemId?: string;
}) {
	const variableGroups: VariableGroup[] = [];

	elements.forEach((element) => {
		if (!isNode(element) || element.id === selectedItemId) {
			return;
		}

		const inputVariables = element.data?.inputVariables;

		if (!Array.isArray(inputVariables)) {
			return;
		}

		const variables = inputVariables
			.filter((inputVariable) => inputVariable?.name)
			.map(({name, type}) => ({
				name,
				type: type || DEFAULT_VARIABLE_TYPE,
			}));

		if (variables.length) {
			variableGroups.push({
				label: element.data?.label?.[defaultLanguageId] || element.id,
				variables,
			});
		}
	});

	return variableGroups;
}

export function getUndeclaredVariableNames(
	text: string,
	inputVariables: Variable[]
) {
	const declaredNames = new Set(inputVariables.map(({name}) => name));

	const undeclaredNames = new Set<string>();

	for (const [, name] of text.matchAll(VARIABLE_REGEXP)) {
		if (!declaredNames.has(name)) {
			undeclaredNames.add(name);
		}
	}

	return [...undeclaredNames];
}

export function parseAgentInputVariableNames(inputVariables?: string) {
	if (!inputVariables) {
		return [];
	}

	return inputVariables
		.split(',')
		.map((name) => name.trim())
		.filter(Boolean);
}

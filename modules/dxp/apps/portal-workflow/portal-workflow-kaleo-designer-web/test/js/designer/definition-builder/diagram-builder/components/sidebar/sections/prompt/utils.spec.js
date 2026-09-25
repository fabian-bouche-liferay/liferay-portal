/**
 * SPDX-FileCopyrightText: (c) 2026 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import {
	addInputVariables,
	getAvailableVariableGroups,
	getConsumedVariableGroups,
	getUndeclaredVariableNames,
	parseAgentInputVariableNames,
} from '../../../../../../../../../src/main/resources/META-INF/resources/designer/js/definition-builder/diagram-builder/components/sidebar/sections/prompt/utils';

const elements = [
	{
		data: {
			label: {en_US: 'Summarize'},
			outputVariables: [
				{name: 'summary', type: 'string'},
				{name: 'ignored', type: 'string'},
			],
		},
		id: 'summarize',
		position: {x: 0, y: 0},
		type: 'llm',
	},
	{
		data: {
			label: {en_US: 'Fetch Product'},
			outputVariables: [{name: 'product', type: 'json'}],
		},
		id: 'fetchProduct',
		position: {x: 0, y: 100},
		type: 'http-request',
	},
	{
		data: {
			label: {en_US: 'Classify'},
			outputVariables: [{name: 'category', type: 'string'}],
		},
		id: 'classify',
		position: {x: 0, y: 200},
		type: 'llm',
	},
	{
		data: {
			label: {en_US: 'Route'},
			outputVariables: [{name: 'ignored', type: 'string'}],
		},
		id: 'route',
		position: {x: 0, y: 300},
		type: 'ai-decision',
	},
	{
		data: {label: {en_US: 'Delegate'}},
		id: 'delegate',
		position: {x: 0, y: 400},
		type: 'ai-hub-agent',
	},
	{
		data: {label: {en_US: 'Start'}},
		id: 'start',
		position: {x: 0, y: 500},
		type: 'start',
	},
	{
		data: {name: 'summarize'},
		id: 'summarize-classify',
		source: 'summarize',
		target: 'classify',
		type: 'transition',
	},
];

describe('The prompt utils should', () => {
	it('Add only the input variables that are not declared yet', () => {
		expect(
			addInputVariables(
				[{name: 'request', type: 'string'}],
				[
					{name: 'request', type: 'string'},
					{name: 'product', type: 'json'},
					{name: 'product', type: 'json'},
				]
			)
		).toEqual([
			{name: 'request', type: 'string'},
			{name: 'product', type: 'json'},
		]);
	});

	it('Group the agent input variables and the variables written by the other nodes', () => {
		expect(
			getAvailableVariableGroups({
				agentInputVariableNames: ['request'],
				elements,
				selectedItemId: 'classify',
			})
		).toEqual([
			{
				label: 'agent',
				variables: [{name: 'request', type: 'string'}],
			},
			{
				label: 'Summarize',
				variables: [
					{name: 'summary', type: 'string'},
					{name: 'output', type: 'string'},
				],
			},
			{
				label: 'Fetch Product',
				variables: [{name: 'product', type: 'json'}],
			},
			{
				label: 'Route',
				variables: [{name: 'reason', type: 'string'}],
			},
			{
				label: 'Delegate',
				variables: [{name: 'output', type: 'string'}],
			},
			{
				label: 'workflow',
				variables: [{name: 'aiHubCellLiferayDXPURL', type: 'string'}],
			},
		]);
	});

	it('Group the declared input variables that no other source provides', () => {
		expect(
			getAvailableVariableGroups({
				elements,
				inputVariables: [
					{name: 'summary', type: 'string'},
					{name: 'resumeURL', type: 'string'},
				],
				selectedItemId: 'classify',
			})
		).toContainEqual({
			label: 'input-variables',
			variables: [{name: 'resumeURL', type: 'string'}],
		});
	});

	it('Ignore the input variables that are not a valid JSON array', () => {
		expect(
			getAvailableVariableGroups({
				inputVariables: '[{"name": "request"',
			})
		).toEqual([]);
	});

	it('Offer the workflow variables only when a node writes them', () => {
		expect(
			getAvailableVariableGroups({
				elements: [
					{
						data: {label: {en_US: 'Summarize'}},
						id: 'summarize',
						position: {x: 0, y: 0},
						type: 'llm',
					},
				],
			})
		).toEqual([
			{
				label: 'Summarize',
				variables: [{name: 'output', type: 'string'}],
			},
		]);
	});

	it('Group the input variables declared by the other nodes', () => {
		expect(
			getConsumedVariableGroups({
				elements: [
					{
						data: {
							inputVariables: [{name: 'summary'}, {}],
							label: {en_US: 'Classify'},
						},
						id: 'classify',
						position: {x: 0, y: 0},
						type: 'llm',
					},
					{
						data: {
							inputVariables: [{name: 'ignored', type: 'json'}],
							label: {en_US: 'Summarize'},
						},
						id: 'summarize',
						position: {x: 0, y: 100},
						type: 'llm',
					},
				],
				selectedItemId: 'summarize',
			})
		).toEqual([
			{
				label: 'Classify',
				variables: [{name: 'summary', type: 'string'}],
			},
		]);
	});

	it('Return the variables used in the text that are not declared', () => {
		expect(
			getUndeclaredVariableNames(
				'Use {{request}}, {{product}} and {{product}} with {{ignored',
				[{name: 'request', type: 'string'}]
			)
		).toEqual(['product']);
	});

	it('Parse the comma separated agent input variables', () => {
		expect(parseAgentInputVariableNames(' request, tone ,,')).toEqual([
			'request',
			'tone',
		]);
		expect(parseAgentInputVariableNames('')).toEqual([]);
		expect(parseAgentInputVariableNames(undefined)).toEqual([]);
	});
});

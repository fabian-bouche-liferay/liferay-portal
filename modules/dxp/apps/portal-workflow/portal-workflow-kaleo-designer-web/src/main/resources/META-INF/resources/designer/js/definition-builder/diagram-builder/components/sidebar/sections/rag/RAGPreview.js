/**
 * SPDX-FileCopyrightText: (c) 2026 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import ClayAlert from '@clayui/alert';
import {ClayButtonWithIcon} from '@clayui/button';
import ClayIcon from '@clayui/icon';
import ClayTabs from '@clayui/tabs';
import {openToast} from 'frontend-js-components-web';
import PropTypes from 'prop-types';
import React, {useState} from 'react';

import {buildSearchRequest} from './utils';

function CodePreview({code}) {
	return (
		<div className="rag-editor-modal-code-preview">
			<pre>{code}</pre>

			<ClayButtonWithIcon
				aria-label={Liferay.Language.get('copy-to-clipboard')}
				displayType="secondary"
				onClick={() =>
					navigator.clipboard.writeText(code).then(() =>
						openToast({
							message: Liferay.Language.get(
								'copied-to-clipboard'
							),
						})
					)
				}
				size="sm"
				symbol="copy"
				title={Liferay.Language.get('copy-to-clipboard')}
			/>
		</div>
	);
}

export default function RAGPreview({rag}) {
	const [activeIndex, setActiveIndex] = useState(0);

	const tabs = [
		{
			code: rag.contentRetriever
				? buildSearchRequest(rag.contentRetriever)
				: null,
			label: Liferay.Language.get('search-request'),
		},
		{
			code: JSON.stringify(rag, null, 2),
			label: Liferay.Language.get('json'),
		},
	];

	return (
		<aside className="rag-editor-modal-preview">
			<h3 className="rag-editor-modal-section-title">
				<ClayIcon className="mr-2" symbol="search" />

				{Liferay.Language.get('preview')}
			</h3>

			<p className="text-secondary">
				{Liferay.Language.get('rag-preview-help')}
			</p>

			<ClayTabs>
				{tabs.map(({label}, index) => (
					<ClayTabs.Item
						active={activeIndex === index}
						key={label}
						onClick={() => setActiveIndex(index)}
					>
						{label}
					</ClayTabs.Item>
				))}
			</ClayTabs>

			<ClayTabs.Content activeIndex={activeIndex}>
				{tabs.map(({code, label}) => (
					<ClayTabs.TabPane key={label}>
						{code ? (
							<CodePreview code={code} />
						) : (
							<p className="text-secondary">
								{Liferay.Language.get(
									'the-liferay-search-is-disabled'
								)}
							</p>
						)}
					</ClayTabs.TabPane>
				))}
			</ClayTabs.Content>

			<h3 className="mt-4 rag-editor-modal-section-title">
				<ClayIcon className="mr-2" symbol="info-circle" />

				{Liferay.Language.get('how-it-works')}
			</h3>

			<ol className="rag-editor-modal-steps">
				<li>
					{Liferay.Language.get(
						'if-a-query-transformer-is-selected-it-rewrites-the-user-query-first'
					)}
				</li>

				<li>
					{Liferay.Language.get(
						'the-liferay-search-api-is-called-with-these-parameters-for-each-query'
					)}
				</li>

				<li>
					{Liferay.Language.get(
						'for-each-query-up-to-five-results-with-a-relevance-score-of-at-least-5-are-kept'
					)}
				</li>

				<li>
					{Liferay.Language.get(
						'the-content-of-the-results-is-added-to-the-prompt-as-context'
					)}
				</li>
			</ol>

			<ClayAlert className="mb-0" displayType="info">
				{Liferay.Language.get(
					'index-based-data-sources-configured-on-the-agent-are-also-searched'
				)}
			</ClayAlert>
		</aside>
	);
}

RAGPreview.propTypes = {
	rag: PropTypes.object.isRequired,
};

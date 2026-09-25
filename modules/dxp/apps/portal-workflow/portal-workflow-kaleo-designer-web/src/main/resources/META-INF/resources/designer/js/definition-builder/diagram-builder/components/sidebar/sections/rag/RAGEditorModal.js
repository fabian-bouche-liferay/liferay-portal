/**
 * SPDX-FileCopyrightText: (c) 2026 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import ClayAlert from '@clayui/alert';
import ClayButton from '@clayui/button';
import ClayForm, {ClayCheckbox} from '@clayui/form';
import ClayIcon from '@clayui/icon';
import classNames from 'classnames';
import PropTypes from 'prop-types';
import React, {useState} from 'react';

import {isObject} from '../../../../../util/utils';
import EditorModal from '../shared-components/EditorModal';
import LiferaySearchParameters, {
	getSearchParameters,
} from './LiferaySearchParameters';
import QueryTransformerFields from './QueryTransformerFields';
import RAGPreview from './RAGPreview';
import {
	DEFAULT_EXPANDED_QUERIES_COUNT,
	LIFERAY_CONTENT_RETRIEVER_KEY,
	buildRAG,
	getInitialSearchParameterValues,
} from './utils';

const QUERY_TRANSFORMER_SECTION = 'queryTransformer';

const SEARCH_PARAMETERS_SECTION = 'searchParameters';

function getSections() {
	return [
		{
			icon: 'search',
			label: Liferay.Language.get('search-parameters'),
			name: SEARCH_PARAMETERS_SECTION,
		},
		{
			icon: 'magic',
			label: Liferay.Language.get('query-transformer'),
			name: QUERY_TRANSFORMER_SECTION,
		},
	];
}

function SectionHeader({description, title}) {
	return (
		<>
			<h3 className="rag-editor-modal-section-title">{title}</h3>

			<p className="text-secondary">{description}</p>
		</>
	);
}

export default function RAGEditorModal({
	initialRAG,
	onApply,
	onClose,
	subtitle,
	title,
}) {
	const invalidInitialRAG = initialRAG !== undefined && !isObject(initialRAG);

	const rag = isObject(initialRAG) ? initialRAG : {};

	const {contentRetriever, queryTransformer} = rag;

	const chaining = queryTransformer?.key === 'chaining';

	const [activeSection, setActiveSection] = useState(
		SEARCH_PARAMETERS_SECTION
	);
	const [expandedQueriesCount, setExpandedQueriesCount] = useState(
		String(
			queryTransformer?.expandedQueriesCount ??
				DEFAULT_EXPANDED_QUERIES_COUNT
		)
	);
	const [liferaySearchEnabled, setLiferaySearchEnabled] = useState(
		contentRetriever?.key === LIFERAY_CONTENT_RETRIEVER_KEY
	);
	const [queryTransformerKey, setQueryTransformerKey] = useState(
		queryTransformer?.key ?? ''
	);
	const [searchParameterInputValues, setSearchParameterInputValues] =
		useState(() =>
			Object.fromEntries(
				getSearchParameters().map(({name}) => [name, ''])
			)
		);
	const [searchParameterValues, setSearchParameterValues] = useState(() =>
		getInitialSearchParameterValues(contentRetriever)
	);

	const newRAG = buildRAG({
		expandedQueriesCount,
		liferaySearchEnabled,
		queryTransformerKey,
		rag,
		searchParameterInputValues,
		searchParameterValues,
	});

	return (
		<EditorModal
			className="rag-editor-modal"
			icon="documents-and-media"
			onApply={() => onApply(newRAG)}
			onClose={onClose}
			subtitle={subtitle}
			title={title}
		>
			<div className="rag-editor-modal-layout">
				<nav className="rag-editor-modal-nav">
					{getSections().map(({icon, label, name}) => (
						<ClayButton
							aria-current={activeSection === name}
							className={classNames('rag-editor-modal-nav-item', {
								active: activeSection === name,
							})}
							displayType="unstyled"
							key={name}
							onClick={() => setActiveSection(name)}
						>
							<ClayIcon className="mr-2" symbol={icon} />

							{label}
						</ClayButton>
					))}
				</nav>

				<div className="rag-editor-modal-content">
					{invalidInitialRAG && (
						<ClayAlert displayType="warning">
							{Liferay.Language.get(
								'the-current-value-is-not-valid-json-and-will-be-replaced'
							)}
						</ClayAlert>
					)}

					{activeSection === SEARCH_PARAMETERS_SECTION && (
						<>
							<SectionHeader
								description={Liferay.Language.get(
									'liferay-search-help'
								)}
								title={Liferay.Language.get(
									'search-parameters'
								)}
							/>

							<ClayForm.Group>
								<ClayCheckbox
									checked={liferaySearchEnabled}
									label={Liferay.Language.get(
										'liferay-search'
									)}
									onChange={() =>
										setLiferaySearchEnabled(
											!liferaySearchEnabled
										)
									}
								/>
							</ClayForm.Group>

							{liferaySearchEnabled && (
								<LiferaySearchParameters
									inputValues={searchParameterInputValues}
									onInputValueChange={(name, inputValue) =>
										setSearchParameterInputValues(
											(previousValues) => ({
												...previousValues,
												[name]: inputValue,
											})
										)
									}
									onValueChange={(name, value) =>
										setSearchParameterValues(
											(previousValues) => ({
												...previousValues,
												[name]: value,
											})
										)
									}
									values={searchParameterValues}
								/>
							)}
						</>
					)}

					{activeSection === QUERY_TRANSFORMER_SECTION && (
						<>
							<SectionHeader
								description={Liferay.Language.get(
									'query-transformer-help'
								)}
								title={Liferay.Language.get(
									'query-transformer'
								)}
							/>

							<QueryTransformerFields
								chaining={chaining}
								expandedQueriesCount={expandedQueriesCount}
								onExpandedQueriesCountChange={
									setExpandedQueriesCount
								}
								onQueryTransformerKeyChange={
									setQueryTransformerKey
								}
								queryTransformerKey={queryTransformerKey}
							/>
						</>
					)}
				</div>

				<RAGPreview rag={newRAG} />
			</div>
		</EditorModal>
	);
}

RAGEditorModal.propTypes = {
	initialRAG: PropTypes.oneOfType([PropTypes.object, PropTypes.string]),
	onApply: PropTypes.func.isRequired,
	onClose: PropTypes.func.isRequired,
	subtitle: PropTypes.string,
	title: PropTypes.string.isRequired,
};

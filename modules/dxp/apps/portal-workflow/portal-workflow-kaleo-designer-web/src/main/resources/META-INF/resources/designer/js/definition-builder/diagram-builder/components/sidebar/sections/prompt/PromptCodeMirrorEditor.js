/**
 * SPDX-FileCopyrightText: (c) 2026 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import {CodeMirror} from '@liferay/frontend-js-codemirror-web';
import {CodeMirrorKeyboardMessage} from 'frontend-js-components-web';
import PropTypes from 'prop-types';
import React, {forwardRef, useEffect, useRef, useState} from 'react';

const VARIABLE_REGEXP = /^\{\{[^{}]+\}\}/;

const VARIABLES_OVERLAY = {
	token(stream) {
		if (stream.match(VARIABLE_REGEXP)) {
			return 'kaleo-designer-variable';
		}

		stream.next();

		while (!stream.eol() && !stream.match(VARIABLE_REGEXP, false)) {
			stream.next();
		}

		return null;
	},
};

const MODES = {
	json: {
		base: {json: true, name: 'javascript'},
		withVariables: 'kaleo-designer-json-with-variables',
	},
	markdown: {
		base: 'markdown',
		withVariables: 'kaleo-designer-markdown-with-variables',
	},
};

Object.values(MODES).forEach(({base, withVariables}) =>
	CodeMirror.defineMode(withVariables, (config) =>
		CodeMirror.overlayMode(
			CodeMirror.getMode(config, base),
			VARIABLES_OVERLAY
		)
	)
);

const TAB_KEY_MAP_NAME = 'tabKey';

const addTabKeyMap = (editor) =>
	editor.addKeyMap({
		'Shift-Tab': false,
		'Tab': false,
		'name': TAB_KEY_MAP_NAME,
	});

const hasTabKeyMap = (editor) =>
	editor.state.keyMaps.some(({name}) => name === TAB_KEY_MAP_NAME);

const PromptCodeMirrorEditor = forwardRef(
	(
		{
			ariaLabel,
			autoFocus = true,
			language = 'markdown',
			onChange,
			onFocus,
			placeholder,
			value,
			variablesHighlighted,
		},
		ref
	) => {
		const editorWrapperRef = useRef(null);
		const onChangeRef = useRef(onChange);
		const onFocusRef = useRef(onFocus);

		const [focused, setFocused] = useState(false);
		const [initialOptions] = useState(() => ({
			ariaLabel,
			autoFocus,
			mode: variablesHighlighted
				? MODES[language].withVariables
				: MODES[language].base,
			placeholder,
			value,
		}));
		const [tabKeyTrapped, setTabKeyTrapped] = useState(false);

		useEffect(() => {
			onChangeRef.current = onChange;
		}, [onChange]);

		useEffect(() => {
			onFocusRef.current = onFocus;
		}, [onFocus]);

		useEffect(() => {
			const editor = CodeMirror(editorWrapperRef.current, {
				autoRefresh: true,
				extraKeys: {
					'Ctrl-M'(codeMirror) {
						const tabKeyMap = hasTabKeyMap(codeMirror);

						if (tabKeyMap) {
							codeMirror.removeKeyMap(TAB_KEY_MAP_NAME);
						}
						else {
							addTabKeyMap(codeMirror);
						}

						setTabKeyTrapped(tabKeyMap);
					},
				},
				inputStyle: 'contenteditable',
				lineNumbers: true,
				lineWrapping: true,
				mode: initialOptions.mode,
				placeholder: initialOptions.placeholder,
				screenReaderLabel: initialOptions.ariaLabel,
				value: initialOptions.value,
			});

			if (typeof ref === 'function') {
				ref(editor);
			}
			else if (ref) {
				ref.current = editor;
			}

			editor.on('blur', () => setFocused(false));
			editor.on('change', (codeMirror) =>
				onChangeRef.current(codeMirror.getValue())
			);
			editor.on('focus', (codeMirror) => {
				setFocused(true);

				onFocusRef.current?.();

				if (!hasTabKeyMap(codeMirror)) {
					addTabKeyMap(codeMirror);

					setTabKeyTrapped(false);
				}
			});

			if (initialOptions.autoFocus) {
				editor.execCommand('goDocEnd');
				editor.focus();
			}

			return () => {
				editor.getWrapperElement().remove();
			};
		}, [initialOptions, ref]);

		return (
			<div className="prompt-code-mirror-editor" ref={editorWrapperRef}>
				{focused && (
					<CodeMirrorKeyboardMessage keyIsEnabled={!tabKeyTrapped} />
				)}
			</div>
		);
	}
);

PromptCodeMirrorEditor.propTypes = {
	ariaLabel: PropTypes.string,
	autoFocus: PropTypes.bool,
	language: PropTypes.oneOf(['json', 'markdown']),
	onChange: PropTypes.func.isRequired,
	onFocus: PropTypes.func,
	placeholder: PropTypes.string,
	value: PropTypes.string,
	variablesHighlighted: PropTypes.bool,
};

export default PromptCodeMirrorEditor;

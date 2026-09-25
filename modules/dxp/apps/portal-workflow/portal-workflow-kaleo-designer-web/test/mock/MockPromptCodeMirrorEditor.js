/**
 * SPDX-FileCopyrightText: (c) 2026 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import React, {forwardRef, useImperativeHandle, useRef} from 'react';

const MockPromptCodeMirrorEditor = forwardRef(
	({ariaLabel, onChange, onFocus, value}, ref) => {
		const textareaRef = useRef(null);

		useImperativeHandle(ref, () => ({
			focus: () => textareaRef.current.focus(),
			replaceSelection: (text) => {
				const textarea = textareaRef.current;

				textarea.value =
					textarea.value.slice(0, textarea.selectionStart) +
					text +
					textarea.value.slice(textarea.selectionEnd);

				onChange(textarea.value);
			},
		}));

		return (
			<textarea
				aria-label={ariaLabel}
				defaultValue={value}
				onChange={(event) => onChange(event.target.value)}
				onFocus={onFocus}
				ref={textareaRef}
			/>
		);
	}
);

export default MockPromptCodeMirrorEditor;

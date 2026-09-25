/**
 * SPDX-FileCopyrightText: (c) 2026 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import {ClayButtonWithIcon} from '@clayui/button';
import {sub} from 'frontend-js-web';
import PropTypes from 'prop-types';
import React from 'react';

export default function OpenEditorButton({label, onClick}) {
	const title = sub(Liferay.Language.get('open-x-editor'), label);

	return (
		<ClayButtonWithIcon
			aria-label={title}
			displayType="unstyled"
			onClick={onClick}
			size="sm"
			symbol="expand"
			title={title}
		/>
	);
}

OpenEditorButton.propTypes = {
	label: PropTypes.string.isRequired,
	onClick: PropTypes.func.isRequired,
};

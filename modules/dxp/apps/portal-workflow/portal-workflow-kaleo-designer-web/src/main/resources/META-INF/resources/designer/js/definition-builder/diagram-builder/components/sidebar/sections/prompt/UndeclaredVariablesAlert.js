/**
 * SPDX-FileCopyrightText: (c) 2026 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import ClayAlert from '@clayui/alert';
import ClayButton from '@clayui/button';
import {sub} from 'frontend-js-web';
import PropTypes from 'prop-types';
import React from 'react';

export default function UndeclaredVariablesAlert({names, onDeclare}) {
	if (!names.length) {
		return null;
	}

	return (
		<ClayAlert
			actions={
				<ClayButton alert onClick={onDeclare}>
					{Liferay.Language.get('declare-variables')}
				</ClayButton>
			}
			className="mb-0 mt-3"
			displayType="warning"
			title={`${Liferay.Language.get('warning')}:`}
		>
			{sub(
				Liferay.Language.get(
					'the-following-variables-are-not-declared-as-input-variables-and-will-not-be-replaced-x'
				),
				names.join(', ')
			)}
		</ClayAlert>
	);
}

UndeclaredVariablesAlert.propTypes = {
	names: PropTypes.arrayOf(PropTypes.string).isRequired,
	onDeclare: PropTypes.func.isRequired,
};

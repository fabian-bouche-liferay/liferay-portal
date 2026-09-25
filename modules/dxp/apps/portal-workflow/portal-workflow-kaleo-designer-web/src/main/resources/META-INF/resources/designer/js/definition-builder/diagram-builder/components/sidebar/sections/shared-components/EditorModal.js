/**
 * SPDX-FileCopyrightText: (c) 2026 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import ClayButton from '@clayui/button';
import ClayIcon from '@clayui/icon';
import ClayModal, {useModal} from '@clayui/modal';
import classNames from 'classnames';
import PropTypes from 'prop-types';
import React from 'react';

export default function EditorModal({
	applyDisabled = false,
	children,
	className,
	footerInfo,
	icon,
	onApply,
	onClose,
	subtitle,
	title,
}) {
	const {observer, onClose: closeModal} = useModal({onClose});

	return (
		<ClayModal
			className={classNames('editor-modal', className)}
			observer={observer}
			size="lg"
		>
			<ClayModal.Header withTitle={false}>
				<ClayModal.ItemGroup>
					{icon && (
						<ClayModal.Item shrink>
							<span className="editor-modal-icon">
								<ClayIcon symbol={icon} />
							</span>
						</ClayModal.Item>
					)}

					<ClayModal.Item>
						<ClayModal.TitleSection>
							<ClayModal.Title>{title}</ClayModal.Title>
						</ClayModal.TitleSection>

						{subtitle && (
							<ClayModal.SubtitleSection>
								<ClayModal.Subtitle>
									{subtitle}
								</ClayModal.Subtitle>
							</ClayModal.SubtitleSection>
						)}
					</ClayModal.Item>

					<ClayModal.Item shrink>
						<ClayButton
							aria-label={Liferay.Language.get('close')}
							className="close"
							displayType="unstyled"
							onClick={closeModal}
						>
							<ClayIcon symbol="times" />
						</ClayButton>
					</ClayModal.Item>
				</ClayModal.ItemGroup>
			</ClayModal.Header>

			<ClayModal.Body>{children}</ClayModal.Body>

			<ClayModal.Footer
				first={footerInfo}
				last={
					<ClayButton.Group spaced>
						<ClayButton
							displayType="secondary"
							onClick={closeModal}
						>
							{Liferay.Language.get('cancel')}
						</ClayButton>

						<ClayButton
							disabled={applyDisabled}
							onClick={() => {
								onApply();

								closeModal();
							}}
						>
							{Liferay.Language.get('apply')}
						</ClayButton>
					</ClayButton.Group>
				}
			/>
		</ClayModal>
	);
}

EditorModal.propTypes = {
	applyDisabled: PropTypes.bool,
	children: PropTypes.node,
	className: PropTypes.string,
	footerInfo: PropTypes.node,
	icon: PropTypes.string,
	onApply: PropTypes.func.isRequired,
	onClose: PropTypes.func.isRequired,
	subtitle: PropTypes.string,
	title: PropTypes.string.isRequired,
};

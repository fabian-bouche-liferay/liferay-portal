/**
 * SPDX-FileCopyrightText: (c) 2026 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import {ClayButtonWithIcon} from '@clayui/button';
import ClayPopover from '@clayui/popover';
import React, {useEffect, useRef, useState} from 'react';

// Leaves time to move the pointer from the trigger to the popover

const CLOSE_DELAY = 200;

export default function VariablesHelpPopover() {
	const closeTimeoutRef = useRef(null);
	const pointerInsideRef = useRef(false);

	const [show, setShow] = useState(false);

	const cancelClose = () => clearTimeout(closeTimeoutRef.current);

	const open = () => {
		cancelClose();

		setShow(true);
	};

	const scheduleClose = () => {
		cancelClose();

		closeTimeoutRef.current = setTimeout(() => setShow(false), CLOSE_DELAY);
	};

	const handleMouseEnter = () => {
		pointerInsideRef.current = true;

		open();
	};

	const handleMouseLeave = () => {
		pointerInsideRef.current = false;

		scheduleClose();
	};

	useEffect(() => () => clearTimeout(closeTimeoutRef.current), []);

	return (
		<ClayPopover
			alignPosition="bottom-right"
			disableScroll
			header={Liferay.Language.get('how-variables-work')}
			onMouseEnter={handleMouseEnter}
			onMouseLeave={handleMouseLeave}
			onShowChange={(newShow) => {

				// Only close on a click outside the trigger and the popover

				if (newShow || !pointerInsideRef.current) {
					cancelClose();

					setShow(newShow);
				}
			}}
			show={show}
			size="lg"
			trigger={
				<ClayButtonWithIcon
					aria-label={Liferay.Language.get('how-variables-work')}
					displayType="unstyled"
					onBlur={() => {
						if (!pointerInsideRef.current) {
							scheduleClose();
						}
					}}
					onFocus={open}
					onKeyDown={(event) => {
						if (event.key === 'Escape') {
							cancelClose();

							setShow(false);
						}
					}}
					onMouseEnter={handleMouseEnter}
					onMouseLeave={handleMouseLeave}
					size="sm"
					symbol="question-circle-full"
				/>
			}
		>
			<ul className="mb-0 pl-3">
				<li>
					{Liferay.Language.get(
						'variables-are-replaced-only-when-they-are-declared-as-input-variables-of-this-node-inserting-a-variable-declares-it-automatically'
					)}
				</li>

				<li>
					{Liferay.Language.get(
						'output-contains-the-latest-response-of-an-llm-or-ai-hub-agent-node-each-of-these-nodes-overwrites-it'
					)}
				</li>

				<li>
					{Liferay.Language.get(
						'reason-contains-the-justification-of-the-transition-chosen-by-the-latest-ai-decision-node'
					)}
				</li>

				<li>
					{Liferay.Language.get(
						'only-the-first-output-variable-of-llm-and-http-request-nodes-receives-their-response'
					)}
				</li>

				<li>
					{Liferay.Language.get(
						'a-variable-stays-empty-until-the-node-that-writes-it-has-run-for-example-aihubcellliferaydxpurl-is-set-by-http-request-and-service-nodes'
					)}
				</li>
			</ul>
		</ClayPopover>
	);
}

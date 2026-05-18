/**
 * SPDX-FileCopyrightText: (c) 2000 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

package com.liferay.portal.workflow.kaleo.aitask.internal;

import com.liferay.portal.workflow.kaleo.aitask.model.AITaskResult;

import java.util.concurrent.CompletableFuture;

/**
 * @author Fabian Bouché
 */
public class AIHubSSESubscription {

	public CompletableFuture<AITaskResult> getResultCompletableFuture() {
		return _resultCompletableFuture;
	}

	public CompletableFuture<String> getSseEventSinkKeyCompletableFuture() {
		return _sseEventSinkKeyCompletableFuture;
	}

	private final CompletableFuture<AITaskResult> _resultCompletableFuture =
		new CompletableFuture<>();

	private final CompletableFuture<String> _sseEventSinkKeyCompletableFuture =
		new CompletableFuture<>();

}
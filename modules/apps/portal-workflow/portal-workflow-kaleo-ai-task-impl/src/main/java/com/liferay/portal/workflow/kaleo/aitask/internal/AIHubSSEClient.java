/**
 * SPDX-FileCopyrightText: (c) 2000 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

package com.liferay.portal.workflow.kaleo.aitask.internal;

import com.liferay.portal.kernel.json.JSONFactory;
import com.liferay.portal.kernel.json.JSONObject;
import com.liferay.portal.kernel.log.Log;
import com.liferay.portal.kernel.log.LogFactoryUtil;
import com.liferay.portal.workflow.kaleo.aitask.model.AITaskResult;

import java.io.BufferedReader;
import java.io.InputStream;
import java.io.InputStreamReader;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;

import java.nio.charset.StandardCharsets;

import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.Deactivate;
import org.osgi.service.component.annotations.Reference;

/**
 * @author Fabian Bouché
 */
@Component(service = AIHubSSEClient.class)
public class AIHubSSEClient {

	public CompletableFuture<AITaskResult> subscribe(
			String serviceURL, String accessToken, String userToken,
			String sseEventSinkKey)
		throws Exception {

		CompletableFuture<AITaskResult> completableFuture =
			new CompletableFuture<>();

		HttpRequest httpRequest = HttpRequest.newBuilder(
		).GET(
		).header(
			"Accept", "text/event-stream"
		).header(
			"Authorization", "Bearer " + accessToken
		).header(
			"liferay-ai-hub-cell-on-behalf-of", userToken
		).uri(
			URI.create(
				serviceURL + "/o/ai-hub/v1.0/agent-instances/subscribe")
		).build();

		_executorService.submit(
			() -> _subscribe(
				completableFuture, httpRequest, sseEventSinkKey));

		return completableFuture;
	}

	@Deactivate
	protected void deactivate() {
		_executorService.shutdownNow();
	}

	private void _subscribe(
		CompletableFuture<AITaskResult> completableFuture,
		HttpRequest httpRequest, String sseEventSinkKey) {

		try {
			HttpResponse<InputStream> httpResponse = _httpClient.send(
				httpRequest, HttpResponse.BodyHandlers.ofInputStream());

			if (httpResponse.statusCode() >= 400) {
				completableFuture.completeExceptionally(
					new IllegalStateException(
						"Unable to subscribe to AI Hub SSE: HTTP " +
							httpResponse.statusCode()));

				return;
			}

			_readEventStream(
				httpResponse.body(), sseEventSinkKey, completableFuture);
		}
		catch (Exception exception) {
			if (!completableFuture.isDone()) {
				completableFuture.completeExceptionally(exception);
			}
		}
	}

	private void _readEventStream(
			InputStream inputStream, String sseEventSinkKey,
			CompletableFuture<AITaskResult> completableFuture)
		throws Exception {

		try (BufferedReader bufferedReader = new BufferedReader(
				new InputStreamReader(inputStream, StandardCharsets.UTF_8))) {

			StringBuilder dataStringBuilder = new StringBuilder();

			String line;

			while (!completableFuture.isDone() &&
				   ((line = bufferedReader.readLine()) != null)) {

				if (line.isBlank()) {
					if (dataStringBuilder.length() > 0) {
						_handleData(
							dataStringBuilder.toString(), sseEventSinkKey,
							completableFuture);

						dataStringBuilder.setLength(0);
					}

					continue;
				}

				if (line.startsWith("data:")) {
					if (dataStringBuilder.length() > 0) {
						dataStringBuilder.append("\n");
					}

					dataStringBuilder.append(
						line.substring("data:".length()).trim());
				}
			}
		}
	}

	private void _handleData(
		String data, String sseEventSinkKey,
		CompletableFuture<AITaskResult> completableFuture) {

		try {
			JSONObject jsonObject = _jsonFactory.createJSONObject(data);

			if (!sseEventSinkKey.equals(
					jsonObject.getString("sseEventSinkKey"))) {

				return;
			}

			String status = jsonObject.getString("status");

			if ("completed".equals(status) || jsonObject.has("output")) {
				completableFuture.complete(_toAITaskResult(jsonObject));
			}
			else if ("failed".equals(status) || jsonObject.has("error")) {
				completableFuture.completeExceptionally(
					new IllegalStateException(data));
			}
		}
		catch (Exception exception) {
			if (_log.isDebugEnabled()) {
				_log.debug(
					"Unable to parse AI Hub SSE data: " + data, exception);
			}
		}
	}

	private AITaskResult _toAITaskResult(JSONObject jsonObject) {
		AITaskResult aiTaskResult = new AITaskResult();

		aiTaskResult.setOutput(jsonObject.toString());

		if (jsonObject.has("transitionName")) {
			aiTaskResult.setTransitionName(
				jsonObject.getString("transitionName"));
		}

		return aiTaskResult;
	}

	private static final Log _log = LogFactoryUtil.getLog(
		AIHubSSEClient.class);

	private final ExecutorService _executorService =
		Executors.newCachedThreadPool();

	private final HttpClient _httpClient = HttpClient.newHttpClient();

	@Reference
	private JSONFactory _jsonFactory;

}
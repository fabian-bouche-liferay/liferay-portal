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

	public AIHubSSESubscription subscribe(
			String serviceURL, String accessToken, String userToken)
		throws Exception {

		AIHubSSESubscription aiHubSSESubscription =
			new AIHubSSESubscription();

		URI uri = URI.create(
			serviceURL + "/o/ai-hub/v1.0/agent-instances/subscribe");

		if (_log.isDebugEnabled()) {
			_log.debug("Subscribing to AI Hub SSE: " + uri);
		}

		HttpRequest httpRequest = HttpRequest.newBuilder(
		).GET(
		).header(
			"Accept", "text/event-stream"
		).header(
			"Authorization", "Bearer " + accessToken
		).header(
			"liferay-ai-hub-cell-on-behalf-of", userToken
		).uri(
			uri
		).build();

		_executorService.submit(
			() -> _subscribe(aiHubSSESubscription, httpRequest));

		return aiHubSSESubscription;
	}

	@Deactivate
	protected void deactivate() {
		_executorService.shutdownNow();
	}

	private void _subscribe(
		AIHubSSESubscription aiHubSSESubscription,
		HttpRequest httpRequest) {

		try {
			if (_log.isDebugEnabled()) {
				_log.debug("Sending AI Hub SSE subscribe request");
				_log.debug("AI Hub SSE request URI: " + httpRequest.uri());
				_log.debug(
					"AI Hub SSE request headers: " +
						httpRequest.headers().map());
			}

			HttpResponse<InputStream> httpResponse = _httpClient.send(
				httpRequest, HttpResponse.BodyHandlers.ofInputStream());

			if (_log.isDebugEnabled()) {
				_log.debug(
					"AI Hub SSE response status: " +
						httpResponse.statusCode());
				_log.debug(
					"AI Hub SSE response headers: " +
						httpResponse.headers().map());
			}

			if (httpResponse.statusCode() >= 400) {
				_completeExceptionally(
					aiHubSSESubscription,
					new IllegalStateException(
						"Unable to subscribe to AI Hub SSE: HTTP " +
							httpResponse.statusCode()));

				return;
			}

			_readEventStream(httpResponse.body(), aiHubSSESubscription);
		}
		catch (Exception exception) {
			if (_log.isDebugEnabled()) {
				_log.debug("Unable to subscribe to AI Hub SSE", exception);
			}

			_completeExceptionally(aiHubSSESubscription, exception);
		}
	}

	private void _readEventStream(
			InputStream inputStream, AIHubSSESubscription aiHubSSESubscription)
		throws Exception {

		try (BufferedReader bufferedReader = new BufferedReader(
				new InputStreamReader(inputStream, StandardCharsets.UTF_8))) {

			StringBuilder dataStringBuilder = new StringBuilder();

			String event = null;

			String line;

			while (!aiHubSSESubscription.getResultCompletableFuture(
				).isDone() &&
				   ((line = bufferedReader.readLine()) != null)) {

				if (_log.isDebugEnabled()) {
					_log.debug("AI Hub SSE raw line: " + line);
				}

				if (line.isBlank()) {
					if (dataStringBuilder.length() > 0) {
						String data = dataStringBuilder.toString();

						if (_log.isDebugEnabled()) {
							_log.debug("AI Hub SSE event: " + event);
							_log.debug("AI Hub SSE data: " + data);
						}

						if ("Subscribe".equals(event)) {
							_handleSubscribeEvent(
								data, aiHubSSESubscription);
						}
						else {
							_handleData(data, aiHubSSESubscription);
						}

						dataStringBuilder.setLength(0);
					}

					event = null;

					continue;
				}

				if (line.startsWith("event:")) {
					event = line.substring("event:".length()).trim();

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

			if (!aiHubSSESubscription.getResultCompletableFuture().isDone()) {
				aiHubSSESubscription.getResultCompletableFuture(
				).completeExceptionally(
					new IllegalStateException(
						"AI Hub SSE stream ended before receiving result"));
			}
		}
	}

	private void _handleSubscribeEvent(
		String data, AIHubSSESubscription aiHubSSESubscription) {

		String sseEventSinkKey = data.trim();

		if (_log.isDebugEnabled()) {
			_log.debug(
				"AI Hub SSE subscribed sink key: " + sseEventSinkKey);
		}

		aiHubSSESubscription.getSseEventSinkKeyCompletableFuture(
		).complete(
			sseEventSinkKey);
	}

	private void _handleData(
		String data, AIHubSSESubscription aiHubSSESubscription) {

		data = data.trim();

		if (!data.startsWith("{")) {
			if (_log.isDebugEnabled()) {
				_log.debug("Ignoring non-JSON AI Hub SSE data: " + data);
			}

			return;
		}

		try {
			JSONObject jsonObject = _jsonFactory.createJSONObject(data);

			if (_log.isDebugEnabled()) {
				_log.debug("AI Hub SSE JSON payload: " + jsonObject);
			}

			if (jsonObject.has("error")) {
				aiHubSSESubscription.getResultCompletableFuture(
				).completeExceptionally(
					new IllegalStateException(data));

				return;
			}

			aiHubSSESubscription.getResultCompletableFuture(
			).complete(
				_toAITaskResult(jsonObject));
		}
		catch (Exception exception) {
			if (_log.isDebugEnabled()) {
				_log.debug(
					"Unable to parse AI Hub SSE data: " + data, exception);
			}
		}
	}

	private void _completeExceptionally(
		AIHubSSESubscription aiHubSSESubscription, Exception exception) {

		if (!aiHubSSESubscription.getSseEventSinkKeyCompletableFuture(
			).isDone()) {

			aiHubSSESubscription.getSseEventSinkKeyCompletableFuture(
			).completeExceptionally(
				exception);
		}

		if (!aiHubSSESubscription.getResultCompletableFuture().isDone()) {
			aiHubSSESubscription.getResultCompletableFuture(
			).completeExceptionally(
				exception);
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
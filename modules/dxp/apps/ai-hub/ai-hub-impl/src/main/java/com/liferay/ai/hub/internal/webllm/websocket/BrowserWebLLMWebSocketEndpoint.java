package com.liferay.ai.hub.internal.webllm.websocket;

import com.liferay.ai.hub.internal.webllm.BrowserWebLLMCapabilities;
import com.liferay.ai.hub.internal.webllm.BrowserWebLLMChatRequest;
import com.liferay.ai.hub.internal.webllm.BrowserWebLLMJobMessageFactory;
import com.liferay.ai.hub.internal.webllm.websocket.BrowserWebLLMWebSocketSender;
import com.liferay.ai.hub.internal.webllm.websocket.BrowserWebLLMWebSocketWorker;
import com.liferay.ai.hub.internal.webllm.BrowserWebLLMWorkerRegistry;
import com.liferay.portal.kernel.json.JSONFactory;
import com.liferay.portal.kernel.json.JSONObject;
import com.liferay.portal.kernel.log.Log;
import com.liferay.portal.kernel.log.LogFactoryUtil;

import jakarta.websocket.CloseReason;
import jakarta.websocket.Endpoint;
import jakarta.websocket.EndpointConfig;
import jakarta.websocket.MessageHandler;
import jakarta.websocket.Session;

import java.io.IOException;

import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;

import org.osgi.service.component.annotations.Activate;
import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.Reference;

@Component(
	property = "org.osgi.http.websocket.endpoint.path=/o/ai-hub/webllm",
	service = Endpoint.class
)
public class BrowserWebLLMWebSocketEndpoint extends Endpoint {

	@Activate
	protected void activate() {
		_browserWebLLMJobMessageFactory = new BrowserWebLLMJobMessageFactory(
			_jsonFactory);
	}

	@Override
	public void onOpen(Session session, EndpointConfig endpointConfig) {
		session.setMaxIdleTimeout(0);

		session.addMessageHandler(
			String.class,
			(MessageHandler.Whole<String>)message -> _onMessage(
				message, session));

		_log.info("Browser WebLLM websocket opened: " + session.getId());
	}

	@Override
	public void onClose(Session session, CloseReason closeReason) {
		_unregister(session);

		_log.info(
			"Browser WebLLM websocket closed: " + session.getId() + " " +
				closeReason);
	}

	@Override
	public void onError(Session session, Throwable throwable) {
		_unregister(session);

		_log.error(throwable);
	}

	private long _getCompanyId(Session session) {
		Number companyId = (Number)session.getUserProperties(
		).get(
			"companyId"
		);

		if (companyId == null) {
			return 0;
		}

		return companyId.longValue();
	}

	private BrowserWebLLMWebSocketWorker _getBrowserWebLLMWebSocketWorker(
		Session session) {

		return (BrowserWebLLMWebSocketWorker)session.getUserProperties(
		).get(
			"browserWebLLMWebSocketWorker"
		);
	}

	private long _getUserId(Session session) {
		Number userId = (Number)session.getUserProperties(
		).get(
			"userId"
		);

		if (userId == null) {
			return 0;
		}

		return userId.longValue();
	}

	private void _onMessage(String message, Session session) {
		try {
			JSONObject jsonObject = _jsonFactory.createJSONObject(message);

			String type = jsonObject.getString("type");

			if (type.equals("register")) {
				_register(jsonObject, session);

				return;
			}

			BrowserWebLLMWebSocketWorker browserWebLLMWebSocketWorker =
				_getBrowserWebLLMWebSocketWorker(session);

			if (browserWebLLMWebSocketWorker == null) {
				_log.warn(
					"Ignoring Browser WebLLM message before registration");

				return;
			}

			if (type.equals("token")) {
				browserWebLLMWebSocketWorker.handleToken(
					jsonObject.getString("jobId"),
					jsonObject.getString("text"));

				return;
			}

			if (type.equals("complete")) {
				browserWebLLMWebSocketWorker.handleComplete(
					jsonObject.getString("jobId"),
					jsonObject.getString("text"));

				return;
			}

			if (type.equals("error")) {
				browserWebLLMWebSocketWorker.handleError(
					jsonObject.getString("jobId"),
					new RuntimeException(jsonObject.getString("message")));

				return;
			}

			_log.warn("Unknown Browser WebLLM message type: " + type);
		}
		catch (Exception exception) {
			_log.error(exception);
		}
	}

	private void _register(JSONObject jsonObject, Session session) {
		long companyId = jsonObject.getLong("companyId");
		long userId = jsonObject.getLong("userId");
		
		if ((companyId <= 0) || (userId <= 0)) {
			throw new IllegalStateException(
				"Unable to resolve authenticated Liferay user for WebLLM");
		}

		String browserSessionId = jsonObject.getString("browserSessionId");

		JSONObject capabilitiesJSONObject = jsonObject.getJSONObject(
			"capabilities");

		BrowserWebLLMCapabilities browserWebLLMCapabilities =
			new BrowserWebLLMCapabilities();

		browserWebLLMCapabilities.setMaxContextTokens(
			capabilitiesJSONObject.getInt("maxContextTokens"));
		browserWebLLMCapabilities.setModel(
			capabilitiesJSONObject.getString("model"));
		browserWebLLMCapabilities.setStreaming(
			capabilitiesJSONObject.getBoolean("streaming"));
		browserWebLLMCapabilities.setWebGPU(
			capabilitiesJSONObject.getBoolean("webGPU"));

		BrowserWebLLMWebSocketWorker browserWebLLMWebSocketWorker =
			new BrowserWebLLMWebSocketWorker(
				companyId, userId, browserSessionId,
				browserWebLLMCapabilities,
				new SessionBrowserWebLLMWebSocketSender(session),
				_scheduledExecutorService);

		session.getUserProperties(
		).put(
			"browserSessionId", browserSessionId
		);

		session.getUserProperties(
		).put(
			"browserWebLLMWebSocketWorker", browserWebLLMWebSocketWorker
		);

		_browserWebLLMWorkerRegistry.register(
			companyId, userId, browserSessionId,
			browserWebLLMWebSocketWorker);

		_log.info(
			"Registered Browser WebLLM worker " + browserSessionId +
				" for user " + userId);
	}

	private void _unregister(Session session) {
		BrowserWebLLMWebSocketWorker browserWebLLMWebSocketWorker =
			_getBrowserWebLLMWebSocketWorker(session);

		if (browserWebLLMWebSocketWorker == null) {
			return;
		}

		browserWebLLMWebSocketWorker.close();

		_browserWebLLMWorkerRegistry.unregister(
			browserWebLLMWebSocketWorker.getCompanyId(),
			browserWebLLMWebSocketWorker.getUserId(),
			browserWebLLMWebSocketWorker.getBrowserSessionId());

		session.getUserProperties(
		).remove(
			"browserWebLLMWebSocketWorker"
		);
	}

	private class SessionBrowserWebLLMWebSocketSender
		implements BrowserWebLLMWebSocketSender {

		public SessionBrowserWebLLMWebSocketSender(Session session) {
			_session = session;
		}

		@Override
		public void sendJob(BrowserWebLLMChatRequest browserWebLLMChatRequest)
			throws IOException {

			JSONObject jsonObject = _browserWebLLMJobMessageFactory.create(
				browserWebLLMChatRequest);

			_session.getAsyncRemote(
			).sendText(
				jsonObject.toString()
			);
		}

		private final Session _session;

	}

	private static final Log _log = LogFactoryUtil.getLog(
		BrowserWebLLMWebSocketEndpoint.class);

	@Reference
	private BrowserWebLLMWorkerRegistry _browserWebLLMWorkerRegistry;

	private BrowserWebLLMJobMessageFactory _browserWebLLMJobMessageFactory;

	@Reference
	private JSONFactory _jsonFactory;

	private final ScheduledExecutorService _scheduledExecutorService =
		Executors.newScheduledThreadPool(4);

}
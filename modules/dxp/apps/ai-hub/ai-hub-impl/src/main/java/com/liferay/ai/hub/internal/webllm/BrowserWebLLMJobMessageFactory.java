package com.liferay.ai.hub.internal.webllm;

import com.liferay.portal.kernel.json.JSONFactory;
import com.liferay.portal.kernel.json.JSONObject;

import java.util.Map;

public class BrowserWebLLMJobMessageFactory {

	public BrowserWebLLMJobMessageFactory(JSONFactory jsonFactory) {
		_browserWebLLMMessageSerializer =
			new BrowserWebLLMMessageSerializer(jsonFactory);

		_jsonFactory = jsonFactory;
	}

	public JSONObject create(BrowserWebLLMChatRequest request) {
		JSONObject jsonObject = _jsonFactory.createJSONObject();

		jsonObject.put("type", "job");
		jsonObject.put("jobId", request.getJobId());
		jsonObject.put(
			"messages",
			_browserWebLLMMessageSerializer.toJSONArray(
				request.getMessages()));

		JSONObject optionsJSONObject = _jsonFactory.createJSONObject();

		Map<String, Object> options = request.getOptions();

		if (options != null) {
			for (Map.Entry<String, Object> entry : options.entrySet()) {
				optionsJSONObject.put(entry.getKey(), entry.getValue());
			}
		}

		jsonObject.put("options", optionsJSONObject);

		return jsonObject;
	}

	private final BrowserWebLLMMessageSerializer
		_browserWebLLMMessageSerializer;
	private final JSONFactory _jsonFactory;

}
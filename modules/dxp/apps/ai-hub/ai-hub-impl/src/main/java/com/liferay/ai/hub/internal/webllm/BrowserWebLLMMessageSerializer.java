package com.liferay.ai.hub.internal.webllm;

import com.liferay.portal.kernel.json.JSONFactory;
import com.liferay.portal.kernel.json.JSONArray;
import com.liferay.portal.kernel.json.JSONObject;

import dev.langchain4j.data.message.AiMessage;
import dev.langchain4j.data.message.ChatMessage;
import dev.langchain4j.data.message.SystemMessage;
import dev.langchain4j.data.message.UserMessage;

import java.util.List;

public class BrowserWebLLMMessageSerializer {

	public BrowserWebLLMMessageSerializer(JSONFactory jsonFactory) {
		_jsonFactory = jsonFactory;
	}

	public JSONArray toJSONArray(List<ChatMessage> chatMessages) {
		JSONArray jsonArray = _jsonFactory.createJSONArray();

		for (ChatMessage chatMessage : chatMessages) {
			jsonArray.put(_toJSONObject(chatMessage));
		}

		return jsonArray;
	}

	private JSONObject _toJSONObject(ChatMessage chatMessage) {
		JSONObject jsonObject = _jsonFactory.createJSONObject();

		if (chatMessage instanceof SystemMessage systemMessage) {
			jsonObject.put("role", "system");
			jsonObject.put("content", systemMessage.text());

			return jsonObject;
		}

		if (chatMessage instanceof UserMessage userMessage) {
			jsonObject.put("role", "user");
			jsonObject.put("content", userMessage.singleText());

			return jsonObject;
		}

		if (chatMessage instanceof AiMessage aiMessage) {
			jsonObject.put("role", "assistant");
			jsonObject.put("content", aiMessage.text());

			return jsonObject;
		}

		jsonObject.put("role", "user");
		jsonObject.put("content", chatMessage.toString());

		return jsonObject;
	}

	private final JSONFactory _jsonFactory;

}
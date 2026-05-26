package com.liferay.portal.workflow.kaleo.httpcall.internal;

import com.liferay.portal.kernel.json.JSONArray;
import com.liferay.portal.kernel.json.JSONFactory;
import com.liferay.portal.kernel.json.JSONObject;
import com.liferay.portal.workflow.kaleo.runtime.ExecutionContext;

import java.io.Serializable;
import java.util.HashMap;
import java.util.Map;

import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.Reference;

/**
 * @author Fabian Bouché
 */
@Component(service = HTTPCallInputMapper.class)
public class HTTPCallInputMapper {

	public Map<String, Serializable> map(
			String inputMappings, ExecutionContext executionContext)
		throws Exception {

		Map<String, Serializable> variables = new HashMap<>();

		if ((inputMappings == null) || inputMappings.isBlank()) {
			return variables;
		}

		JSONArray jsonArray = _jsonFactory.createJSONArray(inputMappings);

		for (int i = 0; i < jsonArray.length(); i++) {
			JSONObject mappingJSONObject = jsonArray.getJSONObject(i);

			Object value = _getValue(
				mappingJSONObject.getString("source"),
				executionContext.getWorkflowContext());

			if (value instanceof Serializable) {
				variables.put(
					mappingJSONObject.getString("target"),
					(Serializable)value);
			}
			else if (value != null) {
				variables.put(
					mappingJSONObject.getString("target"),
					String.valueOf(value));
			}
		}

		return variables;
	}

	private Object _getValue(
		String source, Map<String, Serializable> workflowContext) {

		if (source == null) {
			return null;
		}

		if (source.startsWith("workflowContext.")) {
			return workflowContext.get(
				source.substring("workflowContext.".length()));
		}

		return workflowContext.get(source);
	}

	@Reference
	private JSONFactory _jsonFactory;
}
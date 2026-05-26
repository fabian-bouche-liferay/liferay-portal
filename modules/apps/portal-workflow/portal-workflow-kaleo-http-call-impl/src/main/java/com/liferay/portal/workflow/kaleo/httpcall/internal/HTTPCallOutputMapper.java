package com.liferay.portal.workflow.kaleo.httpcall.internal;

import com.liferay.portal.kernel.json.JSONArray;
import com.liferay.portal.kernel.json.JSONFactory;
import com.liferay.portal.kernel.json.JSONObject;
import com.liferay.portal.workflow.kaleo.runtime.ExecutionContext;

import java.io.Serializable;

import java.util.Map;

import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.Reference;

@Component(service = HTTPCallOutputMapper.class)
public class HTTPCallOutputMapper {

	public void map(
			String outputMappings, String responseBody,
			ExecutionContext executionContext)
		throws Exception {

		if ((outputMappings == null) || outputMappings.isBlank()) {
			return;
		}
		
		JSONArray jsonArray = _jsonFactory.createJSONArray(outputMappings);

		for (int i = 0; i < jsonArray.length(); i++) {
			JSONObject mappingJSONObject = jsonArray.getJSONObject(i);

			Object value = _getValue(
				mappingJSONObject.getString("source"), responseBody);

			_putValue(
				executionContext.getWorkflowContext(),
				mappingJSONObject.getString("target").toString(), value);
		}
	}

	private Object _getValue(String source, String responseBody)
		throws Exception {

		if (source == null) {
			return null;
		}

		JSONObject outputJSONObject = _jsonFactory.createJSONObject(responseBody);

		if (source.startsWith("output.")) {
			return outputJSONObject.get(
				source.substring("output.".length()));
		}

		return outputJSONObject.get(source);
	}
	
	private void _putValue(
	    Map<String, Serializable> workflowContext, String target,
	    Object value) {

	    if (target == null) {
	        return;
	    }

	    if (target.startsWith("workflowContext.")) {
	        target = target.substring("workflowContext.".length());
	    }

	    if (value instanceof JSONArray || value instanceof JSONObject) {
	        workflowContext.put(target, value.toString());
	    }
	    else if (value instanceof Serializable) {
	        workflowContext.put(target, (Serializable)value);
	    }
	    else if (value != null) {
	        workflowContext.put(target, String.valueOf(value));
	    }
	}	

	@Reference
	private JSONFactory _jsonFactory;

}
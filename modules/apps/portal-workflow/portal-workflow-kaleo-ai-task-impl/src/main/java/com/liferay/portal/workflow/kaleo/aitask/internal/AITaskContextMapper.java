package com.liferay.portal.workflow.kaleo.aitask.internal;

import com.liferay.portal.kernel.json.JSONArray;
import com.liferay.portal.kernel.json.JSONFactory;
import com.liferay.portal.kernel.json.JSONObject;
import com.liferay.portal.workflow.kaleo.runtime.ExecutionContext;

import java.io.Serializable;

import java.util.HashMap;
import java.util.Map;

import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.Reference;

@Component(service = AITaskContextMapper.class)
public class AITaskContextMapper {

	public Map<String, Object> map(
			String inputMappings, ExecutionContext executionContext)
		throws Exception {

		Map<String, Object> context = new HashMap<>();

		if ((inputMappings == null) || inputMappings.isBlank()) {
			return context;
		}

		JSONArray jsonArray = _jsonFactory.createJSONArray(inputMappings);

		for (int i = 0; i < jsonArray.length(); i++) {
			JSONObject jsonObject = jsonArray.getJSONObject(i);

			Object value = _getValue(
				jsonObject.getString("source"), executionContext);

			_putValue(context, jsonObject.getString("target"), value);
		}

		return context;
	}

	private Object _getValue(
		String source, ExecutionContext executionContext) {

		if (source == null) {
			return null;
		}

		Map<String, Serializable> workflowContext =
			executionContext.getWorkflowContext();

		if (source.startsWith("workflowContext.")) {
			return workflowContext.get(
				source.substring("workflowContext.".length()));
		}

		if (source.startsWith("serviceContext.")) {
			String key = source.substring("serviceContext.".length());

			if ("companyId".equals(key)) {
				return executionContext.getServiceContext().getCompanyId();
			}

			if ("scopeGroupId".equals(key)) {
				return executionContext.getServiceContext().getScopeGroupId();
			}

			if ("userId".equals(key)) {
				return executionContext.getServiceContext().getUserId();
			}
		}

		return workflowContext.get(source);
	}

	private void _putValue(
		Map<String, Object> context, String target, Object value) {

		if (target == null) {
			return;
		}

		if (target.startsWith("input.")) {
			target = target.substring("input.".length());
		}

		context.put(target, value);
	}

	@Reference
	private JSONFactory _jsonFactory;

}
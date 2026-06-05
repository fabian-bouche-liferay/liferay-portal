package com.liferay.ai.hub.internal.webllm.websocket.includepoc;

import com.liferay.portal.kernel.servlet.taglib.DynamicInclude;

import java.io.IOException;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import org.osgi.service.component.annotations.Component;

@Component(service = DynamicInclude.class)
public class AIHubWebLLMDynamicInclude implements DynamicInclude {

	@Override
	public void include(
			HttpServletRequest httpServletRequest,
			HttpServletResponse httpServletResponse, String key)
		throws IOException {

		System.out.println("Injecting WebLLM script");

		httpServletResponse.getWriter(
		).write(
			"<script type=\"module\" src=\"/o/ai-hub-impl/webllm/webllm-worker.js\">" +
				"</script>");
	}

	@Override
	public void register(DynamicIncludeRegistry dynamicIncludeRegistry) {
		dynamicIncludeRegistry.register(
			"/html/common/themes/top_head.jsp#post");
	}

}
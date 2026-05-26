package com.liferay.portal.workflow.kaleo.httpcall.internal;

import com.liferay.portal.kernel.encryptor.EncryptorUtil;
import com.liferay.portal.kernel.exception.PortalException;
import com.liferay.portal.kernel.log.Log;
import com.liferay.portal.kernel.log.LogFactoryUtil;
import com.liferay.portal.kernel.model.Company;
import com.liferay.portal.kernel.security.auth.CompanyInheritableThreadLocalCallable;
import com.liferay.portal.kernel.service.CompanyLocalServiceUtil;
import com.liferay.portal.kernel.servlet.HttpMethods;
import com.liferay.portal.kernel.transaction.TransactionCommitCallbackUtil;
import com.liferay.portal.workflow.kaleo.httpcall.HTTPCallClient;
import com.liferay.portal.workflow.kaleo.httpcall.internal.model.HTTPCallSettings;
import com.liferay.portal.workflow.kaleo.model.KaleoInstanceToken;
import com.liferay.portal.workflow.kaleo.model.KaleoNode;
import com.liferay.portal.workflow.kaleo.model.KaleoTransition;
import com.liferay.portal.workflow.kaleo.runtime.ExecutionContext;
import com.liferay.portal.workflow.kaleo.service.KaleoInstanceTokenLocalService;

import java.io.InputStream;
import java.io.Serializable;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpRequest.BodyPublishers;
import java.net.http.HttpResponse;
import java.util.Map;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.Deactivate;
import org.osgi.service.component.annotations.Reference;

/**
 * @author Fabian Bouché
 */
@Component(service = HTTPCallClient.class)
public class HTTPCallClientImpl implements HTTPCallClient {

	@Override
	public void execute(
			KaleoNode currentKaleoNode, ExecutionContext executionContext)
		throws PortalException {

		try {
			TransactionCommitCallbackUtil.registerCallback(
				() -> {
					_executorService.submit(
						() -> {
							try {
								new CompanyInheritableThreadLocalCallable<>(
									() -> {
										_executeAfterCommit(
											currentKaleoNode,
											executionContext);

										return null;
									}
								).call();
							}
							catch (Exception exception) {
								_log.error(
									"Unable to execute HTTP Call",
									exception);
							}
						});

					return null;
				});
		}
		catch (Exception exception) {
			throw new PortalException(
				"Unable to schedule HTTP Call", exception);
		}
	}
	
	private String _escapeJson(String value) {
		return value
			.replace("\\", "\\\\")
			.replace("\"", "\\\"")
			.replace("\n", "\\n")
			.replace("\r", "\\r")
			.replace("\t", "\\t");
	}
	
	private void _executeAfterCommit(
			KaleoNode currentKaleoNode, ExecutionContext executionContext)
		throws Exception {

		HTTPCallSettings httpCallSettings =
			_httpCallSettingsResolver.resolve(currentKaleoNode);

		if (_log.isDebugEnabled()) {
			_log.debug("Input mapping: " + httpCallSettings.getInputMappings());
		}

		Map<String, Serializable> inputVariables =
				_httpCallInputMapper.map(
					httpCallSettings.getInputMappings(), executionContext);
		
		String url = _resolveVariables(
				httpCallSettings.getBaseURL() + httpCallSettings.getUrlQuery(),
				inputVariables, false);
		
		if (_log.isDebugEnabled()) {
			_log.debug("Input variables: " + inputVariables);
		}

		URI uri = URI.create(url);
		
		if (_log.isDebugEnabled()) {
			_log.debug("Making HTTP Call: " + uri);
		}

		long companyId = executionContext.getServiceContext().getCompanyId();
		
		Company company = CompanyLocalServiceUtil.getCompany(companyId);
		
		String userToken = EncryptorUtil.decrypt(
				company.getKeyObj(),
				(String)executionContext.getWorkflowContext().get("userToken"));
		
		if (_log.isDebugEnabled()) {
			_log.debug("User Token: " + userToken);
		}

		if (_log.isDebugEnabled()) {
			_log.debug("Http body (before mapping): " + httpCallSettings.getHttpBody());
		}

		String httpMethod = httpCallSettings.getHttpMethod();
		String httpBody = _resolveVariables(
				httpCallSettings.getHttpBody(), inputVariables, true);

		if (_log.isDebugEnabled()) {
			_log.debug("Http body (after mapping): " + httpBody);
		}

		HttpRequest.Builder builder = HttpRequest.newBuilder();
		if("GET".equals(httpMethod)) {
			builder = builder.GET();
		} else if("POST".equals(httpMethod)) {
			builder = builder.POST(BodyPublishers.ofString(httpBody));
			builder.header("Content-Type", "application/json");
		}
		
		HttpRequest httpRequest = builder.header(
			"liferay-ai-hub-cell-on-behalf-of", userToken
		).uri(
			uri
		).build();		
		
		HttpClient httpClient = HttpClient.newHttpClient();
		
		HttpResponse<InputStream> httpResponse = httpClient.send(
				httpRequest, HttpResponse.BodyHandlers.ofInputStream());
		
		if (_log.isDebugEnabled()) {
			_log.debug(
				"HTTP Call response status: " +
					httpResponse.statusCode());
			_log.debug(
				"HTTP Call response headers: " +
					httpResponse.headers().map());
		}

		String responseBody = new String(
				httpResponse.body().readAllBytes(),
				java.nio.charset.StandardCharsets.UTF_8);
		
		if (_log.isDebugEnabled()) {
			_log.debug("HTTP Call response body: " + responseBody);
		}

		if (_log.isDebugEnabled()) {
			_log.debug("HTTP Call output mapping: " + httpCallSettings.getOutputMappings());
		}
		
		_httpCallOutputMapper.map(httpCallSettings.getOutputMappings(), responseBody, executionContext);
		
		try {

			KaleoTransition kaleoTransition = currentKaleoNode.getDefaultKaleoTransition();

			if (kaleoTransition == null) {
				throw new PortalException(
					"No transition found for HTTP Call node " +
						currentKaleoNode.getName());
			}

			_log.debug("Completing HTTP Call node with transition: " + kaleoTransition.getName());

			KaleoInstanceToken kaleoInstanceToken =
					executionContext.getKaleoInstanceToken();

			_log.debug("Kaleo instance ID: " + kaleoInstanceToken.getKaleoInstanceId());
			_log.debug("Kaleo instance token ID: " + kaleoInstanceToken.getKaleoInstanceTokenId());
			_log.debug("Current token node: " + kaleoInstanceToken.getCurrentKaleoNode().getName());
			_log.debug("HTTP Call node name: " + currentKaleoNode.getName());
			_log.debug("Transition source: " + kaleoTransition.getSourceKaleoNodeName());
			_log.debug("Transition target: " + kaleoTransition.getTargetKaleoNodeName());			
			
			_httpCallWorkflowCompleter.complete(
					kaleoInstanceToken.getCompanyId(),
					kaleoInstanceToken.getUserId(),
					kaleoInstanceToken.getGroupId(),
					kaleoInstanceToken.getKaleoInstanceId(),
					kaleoTransition.getName(),
					executionContext.getWorkflowContext());

			_log.debug("Completed HTTP Call node");
			
			KaleoInstanceToken updatedKaleoInstanceToken =
					_kaleoInstanceTokenLocalService.getKaleoInstanceToken(
						kaleoInstanceToken.getKaleoInstanceTokenId());

			_log.debug(
				"Updated token current node: " +
					updatedKaleoInstanceToken.getCurrentKaleoNode().getName());
			_log.debug(
				"Updated token completed: " +
					updatedKaleoInstanceToken.isCompleted());			
		}
		finally {

		}
	}	
	
	private String _resolveVariables(
		String value, Map<String, Serializable> variables, boolean escape) {

		if (value == null) {
			return null;
		}

		for (Map.Entry<String, Serializable> entry : variables.entrySet()) {
			if(escape) {
				value = value.replace(
						"{{" + entry.getKey() + "}}",
						_escapeJson(String.valueOf(entry.getValue())));
			} else {
				value = value.replace(
						"{{" + entry.getKey() + "}}",
						String.valueOf(entry.getValue()));
			}
		}

		return value;
	}

	@Deactivate
	protected void deactivate() {
		_executorService.shutdownNow();
	}    
	
	private static final Log _log = LogFactoryUtil.getLog(
			HTTPCallClientImpl.class);

	private final ExecutorService _executorService =
		Executors.newCachedThreadPool();	

	@Reference
	private HTTPCallWorkflowCompleter _httpCallWorkflowCompleter;
	
	@Reference
	private KaleoInstanceTokenLocalService _kaleoInstanceTokenLocalService;
	
	@Reference
	private HTTPCallInputMapper _httpCallInputMapper;

	@Reference
	private HTTPCallOutputMapper _httpCallOutputMapper;
	
	@Reference
	private HTTPCallSettingsResolver _httpCallSettingsResolver;
}

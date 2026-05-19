package com.liferay.portal.workflow.kaleo.httpcall.internal;

import com.liferay.portal.kernel.encryptor.EncryptorUtil;
import com.liferay.portal.kernel.exception.PortalException;
import com.liferay.portal.kernel.log.Log;
import com.liferay.portal.kernel.log.LogFactoryUtil;
import com.liferay.portal.kernel.model.Company;
import com.liferay.portal.kernel.security.auth.CompanyInheritableThreadLocalCallable;
import com.liferay.portal.kernel.service.CompanyLocalServiceUtil;
import com.liferay.portal.kernel.transaction.TransactionCommitCallbackUtil;
import com.liferay.portal.workflow.kaleo.httpcall.HTTPCallClient;
import com.liferay.portal.workflow.kaleo.httpcall.internal.model.HTTPCallSettings;
import com.liferay.portal.workflow.kaleo.model.KaleoInstanceToken;
import com.liferay.portal.workflow.kaleo.model.KaleoNode;
import com.liferay.portal.workflow.kaleo.model.KaleoTransition;
import com.liferay.portal.workflow.kaleo.runtime.ExecutionContext;
import com.liferay.portal.workflow.kaleo.service.KaleoInstanceTokenLocalService;

import java.io.InputStream;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
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
	
	private void _executeAfterCommit(
			KaleoNode currentKaleoNode, ExecutionContext executionContext)
		throws Exception {

		HTTPCallSettings httpCallSettings =
			_httpCallSettingsResolver.resolve(currentKaleoNode);
		
		URI uri = URI.create(
				httpCallSettings.getBaseURL() + httpCallSettings.getUrlQuery());

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
		
		HttpRequest httpRequest = HttpRequest.newBuilder(
		).GET(
		).header(
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
	private HTTPCallSettingsResolver _httpCallSettingsResolver;
}

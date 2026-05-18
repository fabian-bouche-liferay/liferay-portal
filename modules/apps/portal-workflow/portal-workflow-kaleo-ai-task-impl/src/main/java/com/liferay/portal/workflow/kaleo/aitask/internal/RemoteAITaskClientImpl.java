/**
 * SPDX-FileCopyrightText: (c) 2000 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

package com.liferay.portal.workflow.kaleo.aitask.internal;

import com.liferay.ai.hub.cell.rest.dto.v1_0.AuthorizationToken;
import com.liferay.ai.hub.cell.rest.resource.v1_0.AuthorizationTokenResource;
import com.liferay.ai.hub.rest.client.dto.v1_0.AgentInstance;
import com.liferay.ai.hub.rest.client.resource.v1_0.AgentInstanceResource;
import com.liferay.portal.kernel.exception.PortalException;
import com.liferay.portal.kernel.log.Log;
import com.liferay.portal.kernel.log.LogFactoryUtil;
import com.liferay.portal.kernel.model.Company;
import com.liferay.portal.kernel.model.User;
import com.liferay.portal.kernel.security.auth.CompanyInheritableThreadLocalCallable;
import com.liferay.portal.kernel.security.auth.CompanyThreadLocal;
import com.liferay.portal.kernel.security.auth.PrincipalThreadLocal;
import com.liferay.portal.kernel.security.permission.PermissionChecker;
import com.liferay.portal.kernel.security.permission.PermissionCheckerFactory;
import com.liferay.portal.kernel.security.permission.PermissionThreadLocal;
import com.liferay.portal.kernel.service.CompanyLocalService;
import com.liferay.portal.kernel.service.ServiceContext;
import com.liferay.portal.kernel.service.ServiceContextThreadLocal;
import com.liferay.portal.kernel.service.UserLocalService;
import com.liferay.portal.kernel.transaction.TransactionCommitCallbackUtil;
import com.liferay.portal.kernel.util.Validator;
import com.liferay.portal.workflow.kaleo.aitask.RemoteAITaskClient;
import com.liferay.portal.workflow.kaleo.aitask.internal.model.AITaskSettings;
import com.liferay.portal.workflow.kaleo.aitask.model.AITaskResult;
import com.liferay.portal.workflow.kaleo.model.KaleoInstanceToken;
import com.liferay.portal.workflow.kaleo.model.KaleoNode;
import com.liferay.portal.workflow.kaleo.model.KaleoTransition;
import com.liferay.portal.workflow.kaleo.runtime.ExecutionContext;
import com.liferay.portal.workflow.kaleo.service.KaleoInstanceTokenLocalService;

import java.net.URL;
import java.util.Map;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;

import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.Deactivate;
import org.osgi.service.component.annotations.Reference;

/**
 * @author Fabian Bouché
 */
@Component(service = RemoteAITaskClient.class)
public class RemoteAITaskClientImpl implements RemoteAITaskClient {

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
									"Unable to execute remote AI task",
									exception);
							}
						});

					return null;
				});
		}
		catch (Exception exception) {
			throw new PortalException(
				"Unable to schedule remote AI task", exception);
		}
	}

	@Deactivate
	protected void deactivate() {
		_executorService.shutdownNow();
	}

	private void _executeAfterCommit(
			KaleoNode currentKaleoNode, ExecutionContext executionContext)
		throws Exception {

		AITaskSettings aiTaskSettings =
			_aiTaskSettingsResolver.resolve(currentKaleoNode);

		long userId = executionContext.getKaleoInstanceToken().getUserId();

		String originalName = PrincipalThreadLocal.getName();

		PermissionChecker originalPermissionChecker =
			PermissionThreadLocal.getPermissionChecker();

		ServiceContext originalServiceContext =
			ServiceContextThreadLocal.getServiceContext();

		long originalCompanyId = CompanyThreadLocal.getCompanyId();
		
		try {
			Company company = _companyLocalService.getCompany(
				executionContext.getServiceContext().getCompanyId());

			String portalURL = company.getPortalURL(0);

			if (_log.isDebugEnabled()) {
				_log.debug("Portal URL: " + portalURL);
			}

			URL url = new URL(portalURL);

			if (_log.isDebugEnabled()) {
				_log.debug("Portal URL authority: " + url.getAuthority());
				_log.debug("Portal URL protocol: " + url.getProtocol());
				_log.debug("User Id: " + userId);
			}

			User user = _userLocalService.getUser(userId);

			PrincipalThreadLocal.setName(String.valueOf(userId));

			PermissionThreadLocal.setPermissionChecker(
				_permissionCheckerFactory.create(user));

			ServiceContext threadLocalServiceContext = new ServiceContext();

			threadLocalServiceContext.setCompanyId(user.getCompanyId());
			threadLocalServiceContext.setScopeGroupId(
				executionContext.getServiceContext().getScopeGroupId());
			threadLocalServiceContext.setUserId(userId);

			ServiceContextThreadLocal.pushServiceContext(
				threadLocalServiceContext);

			CompanyThreadLocal.setCompanyId(user.getCompanyId());
			PrincipalThreadLocal.setName(String.valueOf(userId));
			
			AuthorizationToken authorizationToken =
				_authorizationTokenResourceFactory.create(
				).user(
					user
				).checkPermissions(
					false
				).build(
				).postAuthorizationToken();

			_log.debug("Authorization Token service URL: " + authorizationToken.getServiceURL());
			_log.debug("Authorization Token access token null: " + (authorizationToken.getAccessToken() == null));
			_log.debug("Authorization Token user token null: " + (authorizationToken.getUserToken() == null));
			
			AIHubSSESubscription aiHubSSESubscription =
				_aiHubSSEClient.subscribe(
					authorizationToken.getServiceURL(),
					authorizationToken.getAccessToken(),
					authorizationToken.getUserToken());

			String sseEventSinkKey =
				aiHubSSESubscription.getSseEventSinkKeyCompletableFuture(
				).get(
					10, TimeUnit.SECONDS);

			Map<String, Object> context = _aiTaskContextMapper.map(
				aiTaskSettings.getInputMappings(), executionContext);

			if (_log.isDebugEnabled()) {
				_log.debug("SSE Event sink key: " + sseEventSinkKey);
				_log.debug("Context: " + context);
				_log.debug(
					"AI TASK ERC: " +
						aiTaskSettings.
							getAiTaskDefinitionExternalReferenceCode());
			}

			AgentInstance agentInstance = new AgentInstance();

			agentInstance.setAgentDefinitionExternalReferenceCode(
				aiTaskSettings.getAiTaskDefinitionExternalReferenceCode());

			agentInstance.setContext(context);
			agentInstance.setSseEventSinkKey(sseEventSinkKey);

			AgentInstanceResource.builder(
			).bearerToken(
				authorizationToken.getAccessToken()
			).header(
				"liferay-ai-hub-cell-on-behalf-of",
				authorizationToken.getUserToken()
			).endpoint(
				new URL(authorizationToken.getServiceURL())
			).build(
			).postAgentInstance(
				agentInstance
			);

			AITaskResult aiTaskResult =
				aiHubSSESubscription.getResultCompletableFuture(
				).get(
					aiTaskSettings.getTimeout(), TimeUnit.MILLISECONDS);

			if (_log.isDebugEnabled()) {
				_log.debug("AI Task result: " + aiTaskResult.getOutput());
			}

			_log.debug("Mapping AI task output");

			_aiTaskOutputMapper.map(
				aiTaskSettings.getOutputMappings(), aiTaskResult, executionContext);

			_log.debug("Mapped AI task output");

			KaleoTransition kaleoTransition = null;

			if (Validator.isNotNull(aiTaskResult.getTransitionName())) {
				kaleoTransition = currentKaleoNode.getKaleoTransition(
					aiTaskResult.getTransitionName());
			}
			else {
				kaleoTransition = currentKaleoNode.getDefaultKaleoTransition();
			}

			if (kaleoTransition == null) {
				throw new PortalException(
					"No transition found for AI task node " +
						currentKaleoNode.getName());
			}

			_log.debug("Completing AI task node with transition: " + kaleoTransition.getName());

			KaleoInstanceToken kaleoInstanceToken =
					executionContext.getKaleoInstanceToken();

			_log.debug("Kaleo instance ID: " + kaleoInstanceToken.getKaleoInstanceId());
			_log.debug("Kaleo instance token ID: " + kaleoInstanceToken.getKaleoInstanceTokenId());
			_log.debug("Current token node: " + kaleoInstanceToken.getCurrentKaleoNode().getName());
			_log.debug("AI task node name: " + currentKaleoNode.getName());
			_log.debug("Transition source: " + kaleoTransition.getSourceKaleoNodeName());
			_log.debug("Transition target: " + kaleoTransition.getTargetKaleoNodeName());			
			
			_aiTaskWorkflowCompleter.complete(
					kaleoInstanceToken.getCompanyId(),
					kaleoInstanceToken.getUserId(),
					kaleoInstanceToken.getGroupId(),
					kaleoInstanceToken.getKaleoInstanceId(),
					kaleoTransition.getName(),
					executionContext.getWorkflowContext());

			_log.debug("Completed AI task node");
			
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
			ServiceContextThreadLocal.popServiceContext();

			if (originalServiceContext != null) {
				ServiceContextThreadLocal.pushServiceContext(
					originalServiceContext);
			}

			PrincipalThreadLocal.setName(originalName);

			PermissionThreadLocal.setPermissionChecker(
				originalPermissionChecker);
			
			CompanyThreadLocal.setCompanyId(originalCompanyId);
		}
	}

	private static final Log _log = LogFactoryUtil.getLog(
		RemoteAITaskClientImpl.class);

	private final ExecutorService _executorService =
		Executors.newCachedThreadPool();

	@Reference
	private AIHubSSEClient _aiHubSSEClient;

	@Reference
	private AITaskContextMapper _aiTaskContextMapper;

	@Reference
	private AITaskOutputMapper _aiTaskOutputMapper;

	@Reference
	private AITaskSettingsResolver _aiTaskSettingsResolver;

	@Reference
	private AITaskWorkflowCompleter _aiTaskWorkflowCompleter;
	
	@Reference
	private AuthorizationTokenResource.Factory
		_authorizationTokenResourceFactory;

	@Reference
	private CompanyLocalService _companyLocalService;

	@Reference
	private KaleoInstanceTokenLocalService _kaleoInstanceTokenLocalService;
	
	@Reference
	private PermissionCheckerFactory _permissionCheckerFactory;

	@Reference
	private UserLocalService _userLocalService;

}
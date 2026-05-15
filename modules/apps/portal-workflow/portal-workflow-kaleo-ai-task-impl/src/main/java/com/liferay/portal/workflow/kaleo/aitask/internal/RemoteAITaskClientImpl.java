/**
 * SPDX-FileCopyrightText: (c) 2000 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

package com.liferay.portal.workflow.kaleo.aitask.internal;

import com.liferay.ai.hub.cell.rest.client.dto.v1_0.AuthorizationToken;
import com.liferay.ai.hub.cell.rest.client.resource.v1_0.AuthorizationTokenResource;
import com.liferay.ai.hub.rest.client.dto.v1_0.AgentInstance;
import com.liferay.ai.hub.rest.client.problem.Problem;
import com.liferay.ai.hub.rest.client.resource.v1_0.AgentInstanceResource;
import com.liferay.portal.kernel.exception.PortalException;
import com.liferay.portal.kernel.log.Log;
import com.liferay.portal.kernel.log.LogFactoryUtil;
import com.liferay.portal.kernel.model.Company;
import com.liferay.portal.kernel.model.User;
import com.liferay.portal.kernel.security.auth.PrincipalThreadLocal;
import com.liferay.portal.kernel.security.permission.PermissionChecker;
import com.liferay.portal.kernel.security.permission.PermissionCheckerFactory;
import com.liferay.portal.kernel.security.permission.PermissionThreadLocal;
import com.liferay.portal.kernel.service.CompanyLocalService;
import com.liferay.portal.kernel.service.ServiceContext;
import com.liferay.portal.kernel.service.ServiceContextThreadLocal;
import com.liferay.portal.kernel.service.UserLocalService;
import com.liferay.portal.kernel.uuid.PortalUUIDUtil;
import com.liferay.portal.workflow.kaleo.aitask.RemoteAITaskClient;
import com.liferay.portal.workflow.kaleo.aitask.internal.model.AITaskSettings;
import com.liferay.portal.workflow.kaleo.aitask.model.AITaskResult;
import com.liferay.portal.workflow.kaleo.model.KaleoNode;
import com.liferay.portal.workflow.kaleo.runtime.ExecutionContext;

import java.net.URL;

import java.util.Map;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.TimeUnit;

import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.Reference;

/**
 * @author Fabian Bouché
 */
@Component(service = RemoteAITaskClient.class)
public class RemoteAITaskClientImpl implements RemoteAITaskClient {

	@Override
	public AITaskResult execute(
			KaleoNode currentKaleoNode, ExecutionContext executionContext)
		throws PortalException {

		long userId = executionContext.getKaleoInstanceToken().getUserId();

		String originalName = PrincipalThreadLocal.getName();

		PermissionChecker originalPermissionChecker =
			PermissionThreadLocal.getPermissionChecker();

		ServiceContext originalServiceContext =
			ServiceContextThreadLocal.getServiceContext();

		try {
			AITaskSettings aiTaskSettings =
				_aiTaskSettingsResolver.resolve(currentKaleoNode);

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

			_log.debug("PrincipalThreadLocal name: " + PrincipalThreadLocal.getName());
			_log.debug("PrincipalThreadLocal userId: " + PrincipalThreadLocal.getUserId());
			
			AuthorizationToken authorizationToken =
				AuthorizationTokenResource.builder(
				).endpoint(
					url.getAuthority(), url.getProtocol()
				).build(
				).postAuthorizationToken();

			String sseEventSinkKey = PortalUUIDUtil.generate();

			if (_log.isDebugEnabled()) {
				_log.debug("SSE Event sink key: " + sseEventSinkKey);
				_log.debug(
					"Authorization Token service URL: " +
						authorizationToken.getServiceURL());
				_log.debug(
					"Authorization Token access token: " +
						authorizationToken.getAccessToken());
				_log.debug(
					"User Token access token: " +
						authorizationToken.getUserToken());
			}

			CompletableFuture<AITaskResult> completableFuture =
				_aiHubSSEClient.subscribe(
					authorizationToken.getServiceURL(),
					authorizationToken.getAccessToken(),
					authorizationToken.getUserToken(), sseEventSinkKey);

			Map<String, Object> context = _aiTaskContextMapper.map(
				aiTaskSettings.getInputMappings(), executionContext);

			if (_log.isDebugEnabled()) {
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

			AITaskResult aiTaskResult = completableFuture.get(
				aiTaskSettings.getTimeout(), TimeUnit.MILLISECONDS);

			if (_log.isDebugEnabled()) {
				_log.debug("AI Task result: " + aiTaskResult.getOutput());
			}

			_aiTaskOutputMapper.map(
				aiTaskSettings.getOutputMappings(), aiTaskResult,
				executionContext);

			return aiTaskResult;
		}
		catch (Problem.ProblemException problemException) {
			_log.error("Message: " + problemException.getMessage());
			_log.error("Detail: " + problemException.getProblem().getDetail());
			_log.error("Status: " + problemException.getProblem().getStatus());
			_log.error("Title: " + problemException.getProblem().getTitle());
			_log.error("Type: " + problemException.getProblem().getType());

			throw new PortalException(
				"Unable to create AI Hub agent instance", problemException);
		}
		catch (Exception exception) {
			throw new PortalException(
				"Unable to execute remote AI task", exception);
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
		}
	}

	private static final Log _log = LogFactoryUtil.getLog(
		RemoteAITaskClientImpl.class);

	@Reference
	private AIHubSSEClient _aiHubSSEClient;

	@Reference
	private AITaskContextMapper _aiTaskContextMapper;

	@Reference
	private AITaskOutputMapper _aiTaskOutputMapper;

	@Reference
	private AITaskSettingsResolver _aiTaskSettingsResolver;

	@Reference
	private CompanyLocalService _companyLocalService;

	@Reference
	private PermissionCheckerFactory _permissionCheckerFactory;

	@Reference
	private UserLocalService _userLocalService;

}
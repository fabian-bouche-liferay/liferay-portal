/**
 * SPDX-FileCopyrightText: (c) 2000 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

package com.liferay.portal.security.sso.openid.connect.internal.servlet;

import com.liferay.oauth.client.persistence.service.OAuthClientEntryLocalService;
import com.liferay.petra.string.StringPool;
import com.liferay.portal.kernel.exception.PortalException;
import com.liferay.portal.kernel.log.Log;
import com.liferay.portal.kernel.log.LogFactoryUtil;
import com.liferay.portal.kernel.util.ParamUtil;
import com.liferay.portal.security.sso.openid.connect.OpenIdConnectServiceException;
import com.liferay.portal.security.sso.openid.connect.OpenIdConnectServiceException.ProviderException;
import com.liferay.portal.security.sso.openid.connect.persistence.model.OpenIdConnectSession;
import com.liferay.portal.security.sso.openid.connect.persistence.service.OpenIdConnectSessionLocalService;
import com.nimbusds.jose.JOSEException;
import com.nimbusds.jose.JWSAlgorithm;
import com.nimbusds.jose.proc.BadJOSEException;
import com.nimbusds.jwt.JWT;
import com.nimbusds.jwt.JWTParser;
import com.nimbusds.oauth2.sdk.ParseException;
import com.nimbusds.oauth2.sdk.http.HTTPRequest;
import com.nimbusds.oauth2.sdk.http.HTTPResponse;
import com.nimbusds.oauth2.sdk.id.ClientID;
import com.nimbusds.oauth2.sdk.id.Issuer;
import com.nimbusds.openid.connect.sdk.op.OIDCProviderMetadata;
import com.nimbusds.openid.connect.sdk.validators.LogoutTokenValidator;

import java.io.IOException;
import java.net.URL;
import java.util.Dictionary;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

import javax.servlet.Servlet;
import javax.servlet.ServletException;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.osgi.framework.BundleContext;
import org.osgi.framework.InvalidSyntaxException;
import org.osgi.service.cm.Configuration;
import org.osgi.service.cm.ConfigurationAdmin;
import org.osgi.service.component.annotations.Activate;
import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.Modified;
import org.osgi.service.component.annotations.Reference;

@Component(
		configurationPid = "com.liferay.portal.security.sso.openid.connect.internal.configuration.OpenIdConnectProviderConfiguration",
	    immediate = true,
	    property = {
	        "osgi.http.whiteboard.context.path=/",
	        "osgi.http.whiteboard.servlet.pattern=/oidc/backchannel_logout"
	    },
	    service = Servlet.class
	)
public class OpenIdConnectBackchannelLogoutServlet extends HttpServlet {

	/**
	 * 
	 */
	private static final long serialVersionUID = 1L;

	private final static String LOGOUT_TOKEN = "logout_token";
	
	@Override
	protected void doPost(HttpServletRequest httpServletRequest, HttpServletResponse httpServletResponse) throws ServletException, IOException {

		String logoutTokenJWT = ParamUtil.get(httpServletRequest, LOGOUT_TOKEN, StringPool.BLANK);

		if(!StringPool.BLANK.equals(logoutTokenJWT)) {

			if(_log.isDebugEnabled()) {
				_log.debug("Backchannel OIDC logout with token: " + logoutTokenJWT);
			}		

			try {
				JWT logoutToken = JWTParser.parse(logoutTokenJWT);
				
				if(_log.isDebugEnabled()) {
					_log.debug("Parsed Logout Token: " + logoutToken.getParsedString());
				}		
				
				List<String> clientIdList = (List<String>) logoutToken.getJWTClaimsSet().getClaim("aud");
				
				if(clientIdList != null && clientIdList.size() > 0) {

					String externalSessionId = (String) logoutToken.getJWTClaimsSet().getClaim("sid");
					
					OpenIdConnectSession oidcSession = _openIdConnectSessionLocalService
                        .fetchOpenIdConnectSession(externalSessionId);

					String idTokenJWT = oidcSession.getIdToken();
					
					JWT idToken;
					try {
						idToken = JWTParser.parse(idTokenJWT);
						Issuer expectedIssuer = new Issuer(idToken.getJWTClaimsSet().getIssuer());

						// To be made dynamic / configurable
						JWSAlgorithm expectedJWSAlg = JWSAlgorithm.RS256;
							
						String jwksURIString = jwksUriMap.get(idToken.getJWTClaimsSet().getIssuer());						

						if(jwksURIString != null) {
							URL jwkSetURI = new URL(jwksURIString);

							if(_log.isDebugEnabled()) {
								_log.debug("OIDC Provider JWKS " + jwkSetURI.toString());
							}
							
							ClientID clientID = new ClientID(clientIdList.get(0));
							LogoutTokenValidator validator = new LogoutTokenValidator(expectedIssuer, clientID, expectedJWSAlg, jwkSetURI);
							
							validator.validate(logoutToken);
							
							_openIdConnectSessionLocalService.deleteOpenIdConnectSession(oidcSession.getOpenIdConnectSessionId());
							
							if(_log.isInfoEnabled()) {
								_log.info("Terminating oidc session " + externalSessionId + " for userId " + oidcSession.getUserId());
							}
						} else {
							_log.error("Unknown issuer");
						}
					
					} catch (BadJOSEException e) {
						_log.error("Failed to validate Logout Token", e);
					} catch (JOSEException e) {
						_log.error("Failed to validate Logout Token", e);
					}
					
				} else {
					_log.error("Failed to find oidc session");
				}
				
			} catch (PortalException e) {
				_log.error("Failed to find session", e);
			} catch (java.text.ParseException e) {
				_log.error("Failed to parse token", e);
			}

		}

	}
	

	
	private static final Log _log = LogFactoryUtil.getLog(
			OpenIdConnectBackchannelLogoutServlet.class);
	
	@Reference
	private OpenIdConnectSessionLocalService _openIdConnectSessionLocalService;
	
	@Reference
	private OAuthClientEntryLocalService
		_oAuthClientEntryLocalService;
	
    @Activate
    @Modified
    protected void activate(BundleContext bundleContext) {

        String factoryPid = "com.liferay.portal.security.sso.openid.connect.internal.configuration.OpenIdConnectProviderConfiguration";

        jwksUriMap = new ConcurrentHashMap<>();
        
        try {

            Configuration[] configurations = configurationAdmin.listConfigurations("(" + ConfigurationAdmin.SERVICE_FACTORYPID + "=" + factoryPid + ")");

            if (configurations != null) {
                for (Configuration configuration : configurations) {
                    properties = configuration.getProperties();
                    String wellKnownURL = (String) properties.get("discoveryEndPoint");
                    String issuerURL = (String) properties.get("issuerURL");
                    String jwksURI = (String) properties.get("jwksURI");
                    
                	if(_log.isDebugEnabled()) {
                		_log.debug("Reading OIDC Connection metadata...");
                		_log.debug("WellKnownURL: " + wellKnownURL);
                	}
                    
                    if(wellKnownURL != null) {
                    	OIDCProviderMetadata metadata = resolveOIDCProviderMetadata(wellKnownURL);
                    	issuerURL = metadata.getIssuer().getValue();
                    	jwksURI = metadata.getJWKSetURI().toString();
                    }
                	if(jwksURI != null && issuerURL != null) {
                		jwksUriMap.put(issuerURL, jwksURI);
                	}

                	if(_log.isDebugEnabled()) {
	                	_log.debug("issuerURL: " + issuerURL);
	                	_log.debug("jwksURI: " + jwksURI);
                	}

                }
            }
        } catch (IOException e) {
        	_log.error("IO Exception", e);
        } catch (InvalidSyntaxException e) {
        	_log.error("Invalid Syntax exception", e);
		} catch (ProviderException e) {
        	_log.error("ProviderException", e);
		} catch (ParseException e) {
        	_log.error("ParseException", e);
		}
    }
    
	private OIDCProviderMetadata resolveOIDCProviderMetadata(
			String authServerWellKnownURI) throws IOException, ProviderException, ParseException {

		HTTPRequest httpRequest = new HTTPRequest(
			HTTPRequest.Method.GET, new URL(authServerWellKnownURI));

		HTTPResponse httpResponse = httpRequest.send();

		if (httpResponse.getStatusCode() != HTTPResponse.SC_OK) {
			throw new OpenIdConnectServiceException.ProviderException(
				httpResponse.getStatusMessage());
		}

		return OIDCProviderMetadata.parse(httpResponse.getContent());
	}
    
    @Reference
    private ConfigurationAdmin configurationAdmin;
    
    private Dictionary<String, Object> properties;
    
    private Map<String, String> jwksUriMap;

}
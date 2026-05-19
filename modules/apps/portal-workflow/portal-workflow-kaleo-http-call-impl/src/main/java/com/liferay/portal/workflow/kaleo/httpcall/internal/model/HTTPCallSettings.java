package com.liferay.portal.workflow.kaleo.httpcall.internal.model;

/**
 * @author Fabian Bouché
 */
public class HTTPCallSettings {

	public HTTPCallSettings(
			String baseURL, String urlQuery, String httpBody, String httpMethod,
			String inputMappings, String outputMappings, long timeout) {

			_urlQuery = urlQuery;
			_httpBody = httpBody;
			_httpMethod = httpMethod;
			_inputMappings = inputMappings;
			_outputMappings = outputMappings;
			_baseURL = baseURL;
			_timeout = timeout;
		}

		public String getBaseURL() {
			return _baseURL;
		}

		public String getHttpBody() {
			return _httpBody;
		}

		public String getHttpMethod() {
			return _httpMethod;
		}

		public String getInputMappings() {
			return _inputMappings;
		}

		public String getOutputMappings() {
			return _outputMappings;
		}

		public long getTimeout() {
			return _timeout;
		}

		public String getUrlQuery() {
			return _urlQuery;
		}

		private final String _baseURL;
		private final String _httpBody;
		private final String _httpMethod;
		private final String _inputMappings;
		private final String _outputMappings;
		private final long _timeout;
		private final String _urlQuery;
	
}

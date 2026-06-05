package com.liferay.ai.hub.internal.webllm;

public class BrowserWebLLMCapabilities {

	public int getMaxContextTokens() {
		return _maxContextTokens;
	}

	public String getModel() {
		return _model;
	}

	public boolean isStreaming() {
		return _streaming;
	}

	public boolean isWebGPU() {
		return _webGPU;
	}

	public void setMaxContextTokens(int maxContextTokens) {
		_maxContextTokens = maxContextTokens;
	}

	public void setModel(String model) {
		_model = model;
	}

	public void setStreaming(boolean streaming) {
		_streaming = streaming;
	}

	public void setWebGPU(boolean webGPU) {
		_webGPU = webGPU;
	}

	private int _maxContextTokens;
	private String _model;
	private boolean _streaming;
	private boolean _webGPU;

}
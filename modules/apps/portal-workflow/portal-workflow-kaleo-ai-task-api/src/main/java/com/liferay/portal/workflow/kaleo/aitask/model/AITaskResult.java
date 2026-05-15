package com.liferay.portal.workflow.kaleo.aitask.model;

import java.io.Serializable;

public class AITaskResult implements Serializable {

	private static final long serialVersionUID = 1L;

	public String getTransitionName() {
		return _transitionName;
	}

	public void setTransitionName(String transitionName) {
		_transitionName = transitionName;
	}

	private String _transitionName;
	
	public String getOutput() {
		return this._output;
	}
	
	public void setOutput(String output) {
		this._output = output;
	}

	private String _output;

}
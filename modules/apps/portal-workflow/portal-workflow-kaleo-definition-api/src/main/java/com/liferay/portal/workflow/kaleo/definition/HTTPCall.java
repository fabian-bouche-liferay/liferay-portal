package com.liferay.portal.workflow.kaleo.definition;

/**
 * @author Fabian Bouché
 */
public class HTTPCall extends Node {

	public HTTPCall(String description, String name) {
		super(NodeType.HTTP_CALL, name, description);
	}

}
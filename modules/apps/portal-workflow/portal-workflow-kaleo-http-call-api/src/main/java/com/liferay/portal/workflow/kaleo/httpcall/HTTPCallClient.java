package com.liferay.portal.workflow.kaleo.httpcall;

import com.liferay.portal.kernel.exception.PortalException;
import com.liferay.portal.workflow.kaleo.model.KaleoNode;
import com.liferay.portal.workflow.kaleo.runtime.ExecutionContext;

/**
 * @author Fabian Bouché
 */
public interface HTTPCallClient {

    public void execute(KaleoNode currentKaleoNode, ExecutionContext executionContext) throws PortalException;

}

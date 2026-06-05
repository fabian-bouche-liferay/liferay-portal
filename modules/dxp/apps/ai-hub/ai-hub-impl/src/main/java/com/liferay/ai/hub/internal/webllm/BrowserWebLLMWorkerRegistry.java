package com.liferay.ai.hub.internal.webllm;

import java.time.Duration;
import java.util.Optional;

public interface BrowserWebLLMWorkerRegistry {

	Optional<BrowserWebLLMWorker> getAvailableWorker(
		long companyId, long userId);

	void register(
		long companyId, long userId, String browserSessionId,
		BrowserWebLLMWorker worker);

	void unregister(
		long companyId, long userId, String browserSessionId);

	Optional<BrowserWebLLMWorker> awaitAvailableWorker(long companyId, long userId, Duration timeout)
			throws InterruptedException;

}
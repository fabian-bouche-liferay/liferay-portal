package com.liferay.ai.hub.internal.webllm;

import com.liferay.ai.hub.internal.webllm.websocket.BrowserWebLLMWebSocketWorker;
import com.liferay.portal.kernel.log.Log;
import com.liferay.portal.kernel.log.LogFactoryUtil;

import java.time.Duration;
import java.util.Comparator;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.locks.Condition;
import java.util.concurrent.locks.ReentrantLock;

import org.osgi.service.component.annotations.Component;

@Component(service = BrowserWebLLMWorkerRegistry.class)
public class BrowserWebLLMWorkerRegistryImpl
	implements BrowserWebLLMWorkerRegistry {

	@Override
	public Optional<BrowserWebLLMWorker> getAvailableWorker(
		long companyId, long userId) {

		return _findAvailableWorker(companyId, userId);
	}

	@Override
	public Optional<BrowserWebLLMWorker> awaitAvailableWorker(
			long companyId, long userId, Duration timeout)
		throws InterruptedException {

		long deadlineNanos = System.nanoTime() + timeout.toNanos();

		_lock.lock();

		try {
			while (true) {
				Optional<BrowserWebLLMWorker> worker =
					_findAvailableWorker(companyId, userId);

				if (worker.isPresent()) {
					return worker;
				}

				long remainingNanos = deadlineNanos - System.nanoTime();

				if (remainingNanos <= 0) {
					return Optional.empty();
				}

				if (_log.isDebugEnabled()) {
					_log.debug(
						"No WebLLM worker yet for user " + userId +
							", waiting up to " +
							TimeUnit.NANOSECONDS.toSeconds(remainingNanos) +
							"s");
				}

				_workerRegistered.await(remainingNanos, TimeUnit.NANOSECONDS);
			}
		}
		finally {
			_lock.unlock();
		}
	}

	@Override
	public void register(
		long companyId, long userId, String browserSessionId,
		BrowserWebLLMWorker browserWebLLMWorker) {

		if (browserWebLLMWorker instanceof
				BrowserWebLLMWebSocketWorker browserWebLLMWebSocketWorker) {

			browserWebLLMWebSocketWorker.setOnReadyCallback(this::_signalAll);
		}

		_browserWebLLMWorkers.computeIfAbsent(
			_getKey(companyId, userId), key -> new ConcurrentHashMap<>()
		).put(
			browserSessionId, browserWebLLMWorker
		);

		_signalAll();
	}

	@Override
	public void unregister(
		long companyId, long userId, String browserSessionId) {

		String key = _getKey(companyId, userId);

		Map<String, BrowserWebLLMWorker> browserWebLLMWorkers =
			_browserWebLLMWorkers.get(key);

		if (browserWebLLMWorkers == null) {
			return;
		}

		browserWebLLMWorkers.remove(browserSessionId);

		if (browserWebLLMWorkers.isEmpty()) {
			_browserWebLLMWorkers.remove(key);
		}
	}

	private Optional<BrowserWebLLMWorker> _findAvailableWorker(
		long companyId, long userId) {

		Map<String, BrowserWebLLMWorker> browserWebLLMWorkers =
			_browserWebLLMWorkers.get(_getKey(companyId, userId));

		if (browserWebLLMWorkers == null) {
			return Optional.empty();
		}

		return browserWebLLMWorkers.values(
		).stream(
		).filter(
			browserWebLLMWorker ->
				_availableBrowserWebLLMWorkerStatuses.contains(
					browserWebLLMWorker.getStatus())
		).max(
			Comparator.comparingLong(this::_getMaxContextTokens)
		);
	}

	private String _getKey(long companyId, long userId) {
		return companyId + "#" + userId;
	}

	private long _getMaxContextTokens(BrowserWebLLMWorker browserWebLLMWorker) {
		BrowserWebLLMCapabilities browserWebLLMCapabilities =
			browserWebLLMWorker.getCapabilities();

		if (browserWebLLMCapabilities == null) {
			return 0;
		}

		return browserWebLLMCapabilities.getMaxContextTokens();
	}

	private void _signalAll() {
		_lock.lock();

		try {
			_workerRegistered.signalAll();
		}
		finally {
			_lock.unlock();
		}
	}

	private static final Log _log = LogFactoryUtil.getLog(
		BrowserWebLLMWorkerRegistryImpl.class);

	private static final Set<BrowserWebLLMWorkerStatus>
		_availableBrowserWebLLMWorkerStatuses = Set.of(
			BrowserWebLLMWorkerStatus.READY);

	private final Map<String, Map<String, BrowserWebLLMWorker>>
		_browserWebLLMWorkers = new ConcurrentHashMap<>();

	private final ReentrantLock _lock = new ReentrantLock();
	private final Condition _workerRegistered = _lock.newCondition();

}
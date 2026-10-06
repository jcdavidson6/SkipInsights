(() => {
	const config = globalThis.SKIP_INSIGHTS_CONFIG;
	const storage = globalThis.SkipInsightsStorage;
	const aggregate = globalThis.SkipInsightsAggregate;
	if (!config || !storage || !aggregate) return;

	const $ = (id) => document.getElementById(id);
	const formatPercent = (value) => `${Math.round(value * 100)}%`;
	const escapeText = (value) => String(value).replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[character]));
	const changeText = (current, other, points = false) => {
		const difference = points ? Math.round((current - other) * 100) : current - other;
		if (!difference) return 'no change';
		const suffix = points ? ' pts' : difference === 1 || difference === -1 ? ' play' : ' plays';
		return `${difference > 0 ? 'up' : 'down'} ${Math.abs(difference)}${suffix}`;
	};

	let events = [];
	let selectedOffset = 0;

	const renderBars = (target, items) => {
		const max = Math.max(...items.map((item) => item.skipRate), 0.01);
		target.innerHTML = items.length ? items.map((item) => `<div class="bar-row">
			<span class="bar-label" title="${escapeText(item.name)}">${escapeText(item.name)}</span>
			<span class="bar-track"><span class="bar-fill" style="width:${Math.max(4, item.skipRate / max * 100)}%"></span></span>
			<span class="bar-value">${formatPercent(item.skipRate)}</span>
		</div>`).join('') : '<p class="muted">Not enough plays yet.</p>';
	};

	const renderList = (target, items) => {
		target.innerHTML = items.length ? items.map((item) => `<div class="list-item">
			<span>${escapeText(item.name)}</span><span>${item.skips}/${item.plays} skipped · ${formatPercent(item.skipRate)}</span>
		</div>`).join('') : '<p class="muted">Not enough plays yet.</p>';
	};

	const renderHours = (target, hours) => {
		const visible = hours.filter((item) => item.plays >= 5);
		if (!visible.length) {
			target.innerHTML = '<p class="muted">Need 5 plays in an hour to show it.</p>';
			return;
		}
		const max = Math.max(...visible.map((item) => item.skipRate), 0.01);
		target.innerHTML = visible.map((item) => `<div class="hour" title="${item.plays} plays">
			<span class="hour-bar" style="height:${Math.max(4, item.skipRate / max * 58)}px"></span><small>${item.hour}:00</small>
		</div>`).join('');
	};

	const render = async () => {
		const current = aggregate.getWeeklySummary(events, new Date(), selectedOffset);
		const other = aggregate.getWeeklySummary(events, new Date(), selectedOffset === 0 ? -1 : 0);
		const hasData = current.plays > 0;
		$('empty-state').classList.toggle('hidden', hasData);
		$('summary').classList.toggle('hidden', !hasData);
		if (hasData) {
			$('plays').textContent = current.plays;
			$('skip-rate').textContent = formatPercent(current.skipRate);
			$('early-skips').textContent = formatPercent(current.earlySkipRate);
			$('plays-change').textContent = changeText(current.plays, other.plays);
			$('skip-change').textContent = changeText(current.skipRate, other.skipRate, true);
			$('early-change').textContent = changeText(current.earlySkipRate, other.earlySkipRate, true);
			renderBars($('artists'), current.artists);
			renderList($('tracks'), current.tracks);
			renderHours($('hours'), current.hours);
		}
		const settings = await chrome.storage.local.get([config.storageKeys.trackingHealthy, config.storageKeys.trackingPaused]);
		$('health-banner').classList.toggle('hidden', settings[config.storageKeys.trackingHealthy] !== false);
		const paused = settings[config.storageKeys.trackingPaused] === true;
		$('pause-button').textContent = paused ? 'Resume tracking' : 'Pause tracking';
		$('paused-state').classList.toggle('hidden', !paused);
	};

	const createSampleEvents = () => {
		const now = Date.now();
		const samples = [
			['Midnight Drive', 'Neon State', 'skip'], ['Midnight Drive', 'Neon State', 'skip'], ['Midnight Drive', 'Neon State', 'earlySkip'],
			['Midnight Drive', 'Neon State', 'play'], ['Midnight Drive', 'Neon State', 'skip'], ['Sunrise', 'Daybreak', 'play'],
			['Sunrise', 'Daybreak', 'play'], ['Sunrise', 'Daybreak', 'play'], ['Afterglow', 'Neon State', 'earlySkip'],
			['Afterglow', 'Neon State', 'skip'], ['Afterglow', 'Neon State', 'play'], ['Afterglow', 'Neon State', 'skip']
		];
		return samples.map(([track, artist, type], index) => ({
			id: `sample-${index}`, track, artist, playlist: null, secondsPlayed: type === 'play' ? 180 : 8,
			durationSeconds: 200, type, ts: now - (index % 6) * 60 * 60 * 1000
		}));
	};

	const bind = () => {
		document.querySelectorAll('[data-offset]').forEach((button) => button.addEventListener('click', async () => {
			selectedOffset = Number(button.dataset.offset);
			document.querySelectorAll('[data-offset]').forEach((tab) => tab.classList.toggle('active', tab === button));
			await render();
		}));
		$('start-button').addEventListener('click', async () => {
			await chrome.storage.local.set({ [config.storageKeys.onboardingSeen]: true });
			$('onboarding').classList.add('hidden');
			$('app').classList.remove('hidden');
			await render();
		});
		$('pause-button').addEventListener('click', async () => {
			const key = config.storageKeys.trackingPaused;
			const current = await chrome.storage.local.get(key);
			await chrome.storage.local.set({ [key]: current[key] !== true });
			await render();
		});
		$('export-button').addEventListener('click', async () => {
			const data = await storage.exportAll();
			const stamp = new Date().toISOString().replace(/[:.]/g, '-');
			const link = document.createElement('a');
			link.href = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }));
			link.download = `skip-insights-${stamp}.json`;
			link.click();
			URL.revokeObjectURL(link.href);
		});
		$('delete-button').addEventListener('click', async () => {
			if (!window.confirm('Delete all locally stored Skip Insights data?')) return;
			await storage.clearAll();
			events = [];
			await render();
		});
		if (config.DEBUG) {
			$('sample-button').classList.remove('hidden');
			$('sample-button').addEventListener('click', async () => {
				for (const event of createSampleEvents()) await storage.appendEvent(event);
				events = await storage.exportAll();
				await render();
			});
		}
	};

	const init = async () => {
		bind();
		events = await storage.exportAll();
		const result = await chrome.storage.local.get(config.storageKeys.onboardingSeen);
		const firstRun = result[config.storageKeys.onboardingSeen] !== true;
		$(firstRun ? 'onboarding' : 'app').classList.remove('hidden');
		if (!firstRun) await render();
	};
	init().catch((error) => console.error('[Skip Insights] popup failed to load', error));
})();

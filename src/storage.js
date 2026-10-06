const EVENT_KEY = globalThis.SKIP_INSIGHTS_CONFIG?.storageKeys.events || 'events';
let writeQueue = Promise.resolve();

const getValue = async (key) => {
	const result = await chrome.storage.local.get(key);
	return result[key];
};

const appendEvent = (event) => {
	writeQueue = writeQueue.then(async () => {
		const events = (await getValue(EVENT_KEY)) || [];
		await chrome.storage.local.set({ [EVENT_KEY]: [...events, event] });
	});
	return writeQueue;
};

const getEvents = async (rangeStart = -Infinity, rangeEnd = Infinity) => {
	const events = (await getValue(EVENT_KEY)) || [];
	return events.filter((event) => event.ts >= rangeStart && event.ts < rangeEnd);
};

const clearAll = () => {
	writeQueue = writeQueue.then(() => chrome.storage.local.set({ [EVENT_KEY]: [] }));
	return writeQueue;
};

const exportAll = async () => (await getValue(EVENT_KEY)) || [];

const storageApi = { appendEvent, getEvents, clearAll, exportAll };
if (typeof module !== 'undefined' && module.exports) {
	module.exports = storageApi;
} else {
	globalThis.SkipInsightsStorage = storageApi;
}

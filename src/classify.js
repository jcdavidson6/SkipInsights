// This module has no DOM or extension dependencies so thresholds can be tested directly.
function classifyEvent({ secondsPlayed, durationSeconds, endedNaturally = false, replayed = false, thresholds }) {
	const config = thresholds || globalThis.SKIP_INSIGHTS_CONFIG?.thresholds;
	if (!config) throw new Error('Classification thresholds are not configured');

	const seconds = Number(secondsPlayed);
	const duration = Number(durationSeconds);
	if (replayed || endedNaturally || (Number.isFinite(duration) && Number.isFinite(seconds)
		&& seconds >= duration - config.naturalEndBufferSeconds)) return 'play';
	if (!Number.isFinite(seconds) || seconds < 0) return 'play';
	if (seconds < config.earlySkipSeconds) return 'earlySkip';

	const skipBoundary = Number.isFinite(duration) && duration < config.shortTrackSeconds
		? duration * config.shortTrackSkipRatio
		: config.skipSeconds;
	return seconds < skipBoundary ? 'skip' : 'play';
}

if (typeof module !== 'undefined' && module.exports) {
	module.exports = { classifyEvent };
} else {
	globalThis.SkipInsightsClassify = { classifyEvent };
}

// Keep Spotify's private markup assumptions in one place for quick repairs.
const SKIP_INSIGHTS_CONFIG = Object.freeze({
  DEBUG: false,
  healthCheckMs: 10_000,
  pollMs: 1_000,
  thresholds: Object.freeze({
    skipSeconds: 30,
    earlySkipSeconds: 10,
    shortTrackSeconds: 60,
    shortTrackSkipRatio: 0.5,
    naturalEndBufferSeconds: 3
  }),
  storageKeys: Object.freeze({
    events: 'events',
    trackingHealthy: 'trackingHealthy',
    trackingPaused: 'trackingPaused',
    onboardingSeen: 'onboardingSeen'
  }),
  selectors: Object.freeze({
    nowPlayingContainer: [
      // VERIFY: Spotify's player widget selector.
      '[data-testid="now-playing-widget"]',
      // VERIFY: fallback for an accessible player container.
      '[aria-label="Now playing"]'
    ],
    title: [
      // VERIFY: Spotify's title selector.
      '[data-testid="context-item-info-title"]',
      // VERIFY: fallback title inside the now-playing widget.
      '[data-testid="now-playing-widget"] [dir="auto"]'
    ],
    artist: [
      // VERIFY: Spotify's artist selector.
      '[data-testid="context-item-info-artist"]',
      // VERIFY: fallback artist inside the now-playing widget.
      '[data-testid="now-playing-widget"] a[href*="/artist/"]'
    ],
    position: [
      // VERIFY: Spotify's playback position selector.
      '[data-testid="playback-position"]',
      // VERIFY: fallback elapsed-time label.
      '[aria-label^="Elapsed time"]'
    ],
    duration: [
      // VERIFY: Spotify's playback duration selector.
      '[data-testid="playback-duration"]',
      // VERIFY: fallback duration label.
      '[aria-label^="Duration"]'
    ],
    skipForward: [
      // VERIFY: Spotify's skip-forward button selector.
      '[data-testid="control-button-skip-forward"]',
      // VERIFY: fallback accessible next button.
      'button[aria-label="Next"]',
      'button[title="Next"]'
    ]
  }),
  fallbacks: Object.freeze({
    titleFromMediaSession: true,
    artistFromMediaSession: true,
    titleFromDocument: true
  })
});

globalThis.SKIP_INSIGHTS_CONFIG = SKIP_INSIGHTS_CONFIG;

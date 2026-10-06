(() => {
  const config = globalThis.SKIP_INSIGHTS_CONFIG;
  if (!config) return;

  let lastPair = null;
  let lastPosition = null;
  let currentTrack = null;
  let foundPlayerData = false;
  let healthCheckTimer = null;

  const debug = (message, details) => {
    if (config.DEBUG) console.debug(`[Skip Insights] ${message}`, details ?? '');
  };

  const readSelector = (name, root = document) => {
    const selectors = config.selectors[name] ?? [];
    let match = null;
    for (const selector of selectors) {
      const element = root.querySelector(selector);
      debug(element ? `resolved ${name}` : `unresolved ${name}`, selector);
      if (!match && element) match = element;
    }
    return match;
  };

  const textOf = (element) => element?.textContent?.trim() || null;

  const readDocumentMetadata = () => {
    const value = document.title.trim();
    const separator = value.includes(' - ') ? ' - ' : value.includes(' • ') ? ' • ' : null;
    if (!separator) return null;
    const [title, artist] = value.split(separator, 2).map((part) => part.trim());
    return title && artist ? { title, artist } : null;
  };

  const readTitle = (container) => {
    const value = textOf(readSelector('title', container)) || textOf(readSelector('title'));
    if (value) return value;
    const mediaTitle = navigator.mediaSession?.metadata?.title?.trim?.();
    if (config.fallbacks.titleFromMediaSession && mediaTitle) return mediaTitle;
    if (config.fallbacks.titleFromDocument) {
      return readDocumentMetadata()?.title || null;
    }
    return null;
  };

  const readArtist = (container) => {
    const value = textOf(readSelector('artist', container)) || textOf(readSelector('artist'));
    if (value) return value;
    const mediaArtist = navigator.mediaSession?.metadata?.artist?.trim?.();
    if (config.fallbacks.artistFromMediaSession && mediaArtist) return mediaArtist;
    return config.fallbacks.titleFromDocument ? readDocumentMetadata()?.artist || null : null;
  };

  const parseSeconds = (value) => {
    if (!value) return null;
    const parts = value.trim().split(':').map(Number);
    if (parts.some(Number.isNaN)) return null;
    if (parts.length === 2) return parts[0] * 60 + parts[1];
    if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
    return null;
  };

  const inspectPlayer = () => {
    const container = readSelector('nowPlayingContainer');
    const title = readTitle(container || document);
    const artist = readArtist(container || document);
    const position = parseSeconds(textOf(readSelector('position')));
    const duration = parseSeconds(textOf(readSelector('duration')));
    // Resolve this in debug mode too: it is a useful health signal when controls move.
    readSelector('skipForward');

    if (!title || !artist) return null;
    foundPlayerData = true;
    return { title, artist, position, duration };
  };

  const markHealth = async (healthy) => {
    try {
      await chrome.storage.local.set({ [config.storageKeys.trackingHealthy]: healthy });
    } catch (error) {
      debug('could not update health state', error);
    }
  };

  const isPaused = async () => {
    const keys = [config.storageKeys.trackingPaused, config.storageKeys.onboardingSeen];
    const result = await chrome.storage.local.get(keys);
    return result[config.storageKeys.trackingPaused] === true
      || result[config.storageKeys.onboardingSeen] !== true;
  };

  const finishCurrentTrack = async (track, secondsPlayed) => {
    if (!track || !globalThis.SkipInsightsClassify || !globalThis.SkipInsightsStorage) return;
    if (await isPaused()) return;
    const type = globalThis.SkipInsightsClassify.classifyEvent({
      secondsPlayed,
      durationSeconds: track.duration,
      endedNaturally: Number.isFinite(secondsPlayed) && Number.isFinite(track.duration)
        && secondsPlayed >= track.duration - config.thresholds.naturalEndBufferSeconds,
      thresholds: config.thresholds
    });
    const event = {
      id: crypto.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      track: track.title,
      artist: track.artist,
      playlist: null,
      secondsPlayed: Number.isFinite(secondsPlayed) ? secondsPlayed : 0,
      durationSeconds: Number.isFinite(track.duration) ? track.duration : null,
      type,
      ts: Date.now()
    };
    await globalThis.SkipInsightsStorage.appendEvent(event);
  };

  const startHealthCheck = () => {
    healthCheckTimer = setTimeout(() => {
      if (!foundPlayerData) {
        markHealth(false);
        debug('tracking health check failed');
      }
    }, config.healthCheckMs);
  };

  const observe = () => {
    const player = inspectPlayer();
    if (!player) return;
    if (healthCheckTimer) {
      clearTimeout(healthCheckTimer);
      healthCheckTimer = null;
      markHealth(true);
    }

    const pair = `${player.title}\u0000${player.artist}`;
    if (lastPair === null) {
      lastPair = pair;
      currentTrack = player;
      lastPosition = player.position;
      return;
    }
    if (pair !== lastPair) {
      const previousTrack = currentTrack;
      const previousPosition = lastPosition;
      finishCurrentTrack(previousTrack, previousPosition).catch((error) => debug('could not store event', error));
      console.log('[Skip Insights] track change', {
        track: player.title,
        artist: player.artist,
        previousPosition: lastPosition,
        timestamp: Date.now()
      });
      lastPair = pair;
      currentTrack = player;
      lastPosition = player.position;
      return;
    }
    if (Number.isFinite(player.position)) {
      lastPosition = Math.max(lastPosition ?? 0, player.position);
    }
  };

  startHealthCheck();
  observe();
  new MutationObserver(observe).observe(document.body, { subtree: true, childList: true, characterData: true });
  setInterval(observe, config.pollMs);
})();

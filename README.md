# Skip Insights

Skip Insights is a local-only Manifest V3 extension for the Spotify web player. It records completed track transitions and summarizes weekly skip patterns.

## Install for development

1. Open `chrome://extensions` in Chrome.
2. Enable **Developer mode**.
3. Click **Load unpacked**.
4. Select this repository folder.
5. Open `https://open.spotify.com`, play a track, and inspect the page console.

When the observed title and artist pair changes, the content script logs the new track and stores the previous track locally. No Spotify login or live session is included in this repository, so selectors are marked `VERIFY` in `src/config.js`.

## Privacy and limitations

The extension requests only local storage and access to `open.spotify.com`. It makes zero network requests. Events, settings, and exports stay on this device. Spotify's player markup is private and may change; selector health is written to local storage as `trackingHealthy` after a 10-second check.

## Debugging selectors

Set `DEBUG: true` in `src/config.js`, reload the unpacked extension from `chrome://extensions`, then inspect the Spotify page console. The script reports resolved and unresolved configured selectors. Set it back to `false` for normal use.

## Inspecting stored events

Open the Spotify page, then DevTools → **Application** → **Storage** → **Extension storage** and inspect the `events` key. The popup also provides JSON export and delete controls.

To verify the extension stays local, open the Spotify tab's DevTools → **Network**, clear the log, change tracks, open the popup, export, and delete data. Skip Insights does not call `fetch`, XHR, WebSockets, analytics, or remote scripts; Spotify's own requests are unrelated.

## Known limitations

- Chrome desktop and `open.spotify.com` only.
- Spotify DOM changes can require selector updates.
- Playlist context is currently stored as `null` when it is not exposed by the player.
- A same-track replay is intentionally not treated as a skip; the tracker follows title/artist changes and position rather than wall-clock time.

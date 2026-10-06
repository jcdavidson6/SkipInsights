# Skip Insights repository rules

- Build a Manifest V3 Chrome extension for `open.spotify.com` only.
- Use plain JavaScript, HTML, and CSS; no framework, bundler, TypeScript, or runtime npm dependencies.
- Make no network requests. Keep all behavior local to the device.
- Request only the `storage` permission and host access to `https://open.spotify.com/*`.
- Keep every Spotify selector and threshold in `src/config.js`; do not scatter them through code.
- Keep classification logic pure in `src/classify.js`, without DOM or `chrome.*` calls.
- Prefer small, readable files and comments that explain why.
- Follow the PRD as the source of truth and stop at the requested milestone for review.

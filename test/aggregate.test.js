const test = require('node:test');
const assert = require('node:assert/strict');
const { summarizeEvents, topSkipped } = require('../src/aggregate.js');

const event = (track, artist, type, ts = Date.now()) => ({ track, artist, type, ts });

test('summarizes skips and early skips', () => {
  const summary = summarizeEvents([event('A', 'Artist', 'play'), event('B', 'Artist', 'skip'), event('C', 'Artist', 'earlySkip')]);
  assert.deepEqual(summary, { plays: 3, skips: 2, earlySkips: 1, skipRate: 2 / 3, earlySkipRate: 1 / 3 });
});

test('top skipped items require three plays and rank by rate', () => {
  const events = [
    event('Keep', 'A', 'play'), event('Keep', 'A', 'play'), event('Keep', 'A', 'skip'),
    event('Cut', 'B', 'skip'), event('Cut', 'B', 'skip'), event('Cut', 'B', 'skip'),
    event('Too Few', 'C', 'skip'), event('Too Few', 'C', 'skip')
  ];
  assert.deepEqual(topSkipped(events, 'track').map((item) => item.name), ['Cut', 'Keep']);
});

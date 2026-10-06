const test = require('node:test');
const assert = require('node:assert/strict');
const { classifyEvent } = require('../src/classify.js');

const thresholds = {
	skipSeconds: 30,
	earlySkipSeconds: 10,
	shortTrackSeconds: 60,
	shortTrackSkipRatio: 0.5,
	naturalEndBufferSeconds: 3
};
const classify = (input) => classifyEvent({ ...input, thresholds });

test('normal play at the threshold is a play', () => assert.equal(classify({ secondsPlayed: 31, durationSeconds: 240 }), 'play'));
test('five seconds is an early skip', () => assert.equal(classify({ secondsPlayed: 5, durationSeconds: 240 }), 'earlySkip'));
test('twenty-five seconds is a skip', () => assert.equal(classify({ secondsPlayed: 25, durationSeconds: 240 }), 'skip'));
test('short tracks use half their duration', () => assert.equal(classify({ secondsPlayed: 19, durationSeconds: 40 }), 'skip'));
test('natural end is a play', () => assert.equal(classify({ secondsPlayed: 238, durationSeconds: 240, endedNaturally: true }), 'play'));
test('near-natural end is a play', () => assert.equal(classify({ secondsPlayed: 238, durationSeconds: 240 }), 'play'));
test('replays are not skips', () => assert.equal(classify({ secondsPlayed: 0, durationSeconds: 240, replayed: true }), 'play'));
test('seek-then-skip uses the observed position rather than wall time', () => assert.equal(classify({ secondsPlayed: 45, durationSeconds: 240 }), 'play'));

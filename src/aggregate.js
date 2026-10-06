// Pure weekly calculations keep the popup rendering code small and testable.
const startOfWeek = (date) => {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - start.getDay());
  return start;
};

const getWeekRange = (reference = new Date(), offset = 0) => {
  const start = startOfWeek(reference);
  start.setDate(start.getDate() + offset * 7);
  const end = new Date(start);
  end.setDate(end.getDate() + 7);
  return { start, end };
};

const summarizeEvents = (events) => {
  const plays = events.length;
  const skips = events.filter((event) => event.type !== 'play');
  const earlySkips = events.filter((event) => event.type === 'earlySkip');
  return {
    plays,
    skips: skips.length,
    earlySkips: earlySkips.length,
    skipRate: plays ? skips.length / plays : 0,
    earlySkipRate: plays ? earlySkips.length / plays : 0
  };
};

const groupBy = (events, field) => {
  const groups = new Map();
  for (const event of events) {
    const key = event[field] || (field === 'playlist' ? 'No playlist' : 'Unknown');
    const item = groups.get(key) || { name: key, plays: 0, skips: 0 };
    item.plays += 1;
    if (event.type !== 'play') item.skips += 1;
    groups.set(key, item);
  }
  return [...groups.values()].map((item) => ({
    ...item,
    skipRate: item.plays ? item.skips / item.plays : 0
  }));
};

const topSkipped = (events, field, limit = 5, minimumPlays = 3) => groupBy(events, field)
  .filter((item) => item.plays >= minimumPlays)
  .sort((a, b) => b.skipRate - a.skipRate || b.skips - a.skips || a.name.localeCompare(b.name))
  .slice(0, limit);

const byHour = (events) => Array.from({ length: 24 }, (_, hour) => {
  const hourEvents = events.filter((event) => new Date(event.ts).getHours() === hour);
  const summary = summarizeEvents(hourEvents);
  return { hour, ...summary };
});

const getWeeklySummary = (events, reference = new Date(), offset = 0) => {
  const range = getWeekRange(reference, offset);
  const weekEvents = events.filter((event) => event.ts >= range.start.getTime() && event.ts < range.end.getTime());
  return {
    range,
    ...summarizeEvents(weekEvents),
    artists: topSkipped(weekEvents, 'artist'),
    tracks: topSkipped(weekEvents, 'track'),
    playlists: groupBy(weekEvents, 'playlist').sort((a, b) => b.skipRate - a.skipRate),
    hours: byHour(weekEvents)
  };
};

const api = { getWeekRange, summarizeEvents, topSkipped, getWeeklySummary };
if (typeof module !== 'undefined' && module.exports) module.exports = api;
else globalThis.SkipInsightsAggregate = api;

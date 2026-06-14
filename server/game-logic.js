export const STARTING_COINS = 20;

export function segKey(a, b) {
  return a < b ? `${a}-${b}` : `${b}-${a}`;
}

export function buildNetworkIndex({ stations, lines }) {
  const linesByStation = new Map();
  const linesBySegment = new Map();
  const adjacency = new Map();

  for (const s of stations) {
    linesByStation.set(s.id, new Set());
    adjacency.set(s.id, new Set());
  }

  for (const line of lines) {
    for (const stopId of line.stops) {
      linesByStation.get(stopId).add(line.id);
    }
    for (let i = 0; i < line.stops.length - 1; i++) {
      const a = line.stops[i];
      const b = line.stops[i + 1];
      adjacency.get(a).add(b);
      adjacency.get(b).add(a);
      const k = segKey(a, b);
      if (!linesBySegment.has(k)) linesBySegment.set(k, new Set());
      linesBySegment.get(k).add(line.id);
    }
  }

  const interchanges = new Set();
  for (const [stationId, lineSet] of linesByStation) {
    if (lineSet.size >= 2) interchanges.add(stationId);
  }

  return { stations, lines, linesByStation, linesBySegment, interchanges, adjacency };
}

export function bfsDistance(index, startId, destId) {
  if (startId === destId) return 0;
  const visited = new Set([startId]);
  let frontier = [startId];
  let dist = 0;
  while (frontier.length > 0) {
    dist++;
    const next = [];
    for (const node of frontier) {
      for (const nb of index.adjacency.get(node) ?? []) {
        if (visited.has(nb)) continue;
        if (nb === destId) return dist;
        visited.add(nb);
        next.push(nb);
      }
    }
    frontier = next;
  }
  return Infinity;
}

export function pickEndpoints(index, { minDistance = 3, maxTries = 100, rng = Math.random } = {}) {
  const ids = index.stations.map(s => s.id);
  for (let i = 0; i < maxTries; i++) {
    const startId = ids[Math.floor(rng() * ids.length)];
    const destId = ids[Math.floor(rng() * ids.length)];
    if (startId === destId) continue;
    if (bfsDistance(index, startId, destId) >= minDistance) return { startId, destId };
  }
  throw new Error(`No station pair with BFS distance >= ${minDistance} after ${maxTries} tries`);
}

export function validateRoute(index, startId, destId, route) {
  if (!Array.isArray(route) || route.length === 0)
    return { ok: false, reason: 'Route is empty' };

  const keys = [];
  for (const seg of route) {
    if (!seg || typeof seg.a !== 'number' || typeof seg.b !== 'number')
      return { ok: false, reason: 'Each segment must have numeric station ids a and b' };
    const k = segKey(seg.a, seg.b);
    if (!index.linesBySegment.has(k))
      return { ok: false, reason: `Unknown segment ${seg.a}-${seg.b}` };
    keys.push(k);
  }

  const seen = new Set();
  for (const k of keys) {
    if (seen.has(k)) return { ok: false, reason: `Segment ${k} used more than once` };
    seen.add(k);
  }

  if (route[0].a !== startId)
    return { ok: false, reason: 'Route must begin at the start station' };
  for (let i = 1; i < route.length; i++) {
    if (route[i].a !== route[i - 1].b)
      return { ok: false, reason: `Step ${i} does not continue from previous segment` };
  }
  if (route[route.length - 1].b !== destId)
    return { ok: false, reason: 'Route must end at the destination' };

  const linesPerSeg = route.map(seg => [...index.linesBySegment.get(segKey(seg.a, seg.b))]);
  if (!assignLines(route, linesPerSeg, index.interchanges))
    return { ok: false, reason: 'No valid line assignment (line change at a non-interchange station)' };

  return { ok: true };
}

export function executeRoute(route, events, rng = Math.random) {
  if (!events || events.length === 0) throw new Error('No events available');
  let coins = STARTING_COINS;
  const steps = route.map((seg, i) => {
    const event = events[Math.floor(rng() * events.length)];
    coins += event.effect;
    return {
      stepIndex: i,
      fromId: seg.a,
      toId: seg.b,
      eventId: event.id,
      description: event.description,
      effect: event.effect,
      coinAfter: coins,
    };
  });
  return { steps, finalScore: Math.max(0, coins) };
}

function assignLines(route, linesPerSeg, interchanges, i = 0, prevLine = null) {
  if (i === route.length) return true;
  for (const line of linesPerSeg[i]) {
    if (i > 0 && line !== prevLine && !interchanges.has(route[i].a)) continue;
    if (assignLines(route, linesPerSeg, interchanges, i + 1, line)) return true;
  }
  return false;
}

const BASE = "http://localhost:3001/api"

// Parse an error body if present
async function readError(res, fallback) {
  try {
    const body = await res.json()
    return body.error || body.reason || fallback
  } catch {
    return fallback
  }
}

// Full network. Used in the Setup phase
async function getNetworkFull() {
  const res = await fetch(`${BASE}/network/full`, { credentials: "include" })
  if (!res.ok) throw new Error(await readError(res, "Failed to load network"))
  return res.json()
}

// Stations only. Used in the Planning phase map
async function getStations() {
  const res = await fetch(`${BASE}/network/stations`, { credentials: "include" })
  if (!res.ok) throw new Error(await readError(res, "Failed to load stations"))
  return res.json()
}

// Bare segment list (no line info). Used in Planning
async function getSegmentList() {
  const res = await fetch(`${BASE}/network/segments`, { credentials: "include" })
  if (!res.ok) throw new Error(await readError(res, "Failed to load segments"))
  return res.json()
}

// Start a new game. Returns the game object with start/dest stations.
async function startGame() {
  const res = await fetch(`${BASE}/games`, {
    method: "POST",
    credentials: "include",
  })
  if (!res.ok) throw new Error(await readError(res, "Failed to start game"))
  return res.json()
}

// Submit the built route for validation + execution
async function submitRoute(gameId, route) {
  const res = await fetch(`${BASE}/games/${gameId}/submit`, {
    method: "POST",
    body: JSON.stringify({ route: route.map((s) => ({ a: s.a, b: s.b })) }),
    headers: { "Content-Type": "application/json" },
    credentials: "include",
  })
  if (!res.ok) throw new Error(await readError(res, "Failed to submit route"))
  return res.json()
}

// Best score per user, descending. Used in the Ranking page
async function getRanking() {
  const res = await fetch(`${BASE}/ranking`, { credentials: "include" })
  if (!res.ok) throw new Error(await readError(res, "Failed to load ranking"))
  return res.json()
}

export { getNetworkFull, getStations, getSegmentList, startGame, submitRoute, getRanking }

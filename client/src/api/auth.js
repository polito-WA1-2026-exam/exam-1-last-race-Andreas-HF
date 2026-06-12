const BASE = "http://localhost:3001/api"

async function doLogin(username, password) {
  const res = await fetch(`${BASE}/sessions`, {
    method: "POST",
    body: JSON.stringify({ username, password }),
    headers: { "Content-Type": "application/json" },
    credentials: "include",
  })
  if (!res.ok) throw new Error("Login failed")
  return res.json()
}

async function doLogout() {
  const res = await fetch(`${BASE}/sessions/current`, {
    method: "DELETE",
    credentials: "include",
  })
  if (!res.ok) throw new Error("Logout failed")
}

async function checkSession() {
  const res = await fetch(`${BASE}/sessions/current`, { credentials: "include" })
  if (!res.ok) return null
  return res.json()
}

export { doLogin, doLogout, checkSession }

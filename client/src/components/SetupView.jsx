import { useEffect, useState } from "react"
import { Alert, Button, Spinner, Stack } from "react-bootstrap"
import NetworkMap from "./NetworkMap"
import { getNetworkFull } from "../api/api"

// Setup view: the player studies the full map (stations + lines) before starting
// Once they press Start, the server assigns start/dest and the 90s clock begins
function SetupView({ onStart, starting }) {
  const [network, setNetwork] = useState(null)
  const [error, setError] = useState("")

  useEffect(() => {
    getNetworkFull()
      .then(setNetwork)
      .catch((e) => setError(e.message))
  }, [])

  if (error) return <Alert variant="danger">{error}</Alert>
  if (!network) return <Spinner animation="border" className="mt-4" />

  return (
    <Stack gap={3}>
      <div className="d-flex justify-content-between align-items-center">
        <div>
          <h2 className="mb-0">Setup</h2>
          <div className="text-muted">
            Study the network. Each game starts with 20 coins - memorize the lines, because
            once the game starts, they will disappear.
          </div>
        </div>
        <Button size="lg" onClick={onStart} disabled={starting}>
          {starting ? "Starting…" : "Start game"}
        </Button>
      </div>
      <NetworkMap stations={network.stations} lines={network.lines} showLines />
    </Stack>
  )
}

export default SetupView

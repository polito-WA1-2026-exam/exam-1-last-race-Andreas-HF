import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Alert, Button, Card, ListGroup, Spinner, Stack } from "react-bootstrap"

import { getNetworkFull, startGame, submitRoute } from "../api/api"
import SetupView from "./SetupView"
import PlanningView from "./PlanningView"

// Drives the main game flow and state:
//   setup → planning → executing → result → (Play again) → setup
function GameView() {
  const [network, setNetwork] = useState(null) // {stations, lines}
  const [phase, setPhase] = useState("setup") // setup | planning | executing | result
  const [game, setGame] = useState(null) 
  const [route, setRoute] = useState([]) 
  const [execution, setExecution] = useState(null)
  const [starting, setStarting] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")
  const submitted = useRef(false) // to avoid double submissions 

  // Load the full network once for the Setup map.
  useEffect(() => {
    getNetworkFull()
      .then(setNetwork)
      .catch((e) => setError(e.message))
  }, [])

  const nameById = useMemo(() => {
    const m = new Map((network?.stations ?? []).map((s) => [s.id, s.name]))
    return (id) => m.get(id) ?? `Station #${id}`
  }, [network])

  const beginGame = async () => {
    setError("")
    setStarting(true)
    try {
      const g = await startGame()
      setGame(g)
      setRoute([])
      submitted.current = false
      setPhase("planning")
    } catch (e) {
      setError(e.message)
    } finally {
      setStarting(false)
    }
  }

  const addSegment = (seg) => {
    setRoute((prev) => {
      const tail = prev.length ? prev[prev.length - 1].b : game.startStation.id
      if (seg.a === tail) return [...prev, { id: seg.id, a: seg.a, b: seg.b }]
      if (seg.b === tail) return [...prev, { id: seg.id, a: seg.b, b: seg.a }]
      return prev // should not be reachable from the UI
    })
  }

  const undo = () => setRoute((prev) => prev.slice(0, -1))
  const reset = () => setRoute([])

  const submit = useCallback(async () => {
    if (submitted.current) return
    submitted.current = true
    setSubmitting(true)
    setError("")
    try {
      const res = await submitRoute(game.gameId, route)
      setExecution(res)
      setPhase(res.valid && res.steps.length > 0 ? "executing" : "result")
    } catch (e) {
      setError(e.message)
      submitted.current = false // allow a retry if submission failed
    } finally {
      setSubmitting(false)
    }
  }, [game, route])

  const playAgain = () => {
    setGame(null)
    setRoute([])
    setExecution(null)
    setPhase("setup")
  }

  if (error && !network) return <Alert variant="danger">{error}</Alert>
  if (!network) return <Spinner animation="border" className="mt-4" />

  return (
    <div className="my-3">
      {error && (
        <Alert variant="danger" dismissible onClose={() => setError("")}>
          {error}
        </Alert>
      )}

      {phase === "setup" && <SetupView network={network} onStart={beginGame} starting={starting} />}

      {phase === "planning" && game && (
        <PlanningView
          network={network}
          game={game}
          route={route}
          nameOf={nameById}
          onAdd={addSegment}
          onUndo={undo}
          onReset={reset}
          onSubmit={submit}
          submitting={submitting}
        />
      )}

      {phase === "executing" && execution && (
        <ExecutionView execution={execution} nameOf={nameById} onDone={() => setPhase("result")} />
      )}

      {phase === "result" && execution && (
        <ResultView execution={execution} nameOf={nameById} onPlayAgain={playAgain} />
      )}
    </div>
  )
}

// Minimal execution view
// TODO: Animate and polish
function ExecutionView({ execution, nameOf, onDone }) {
  const [shown, setShown] = useState(0)
  const onDoneRef = useRef(onDone)

  useEffect(() => {
    onDoneRef.current = onDone
  })

  useEffect(() => {
    if (shown >= execution.steps.length) {
      const t = setTimeout(() => onDoneRef.current(), 800)
      return () => clearTimeout(t)
    }
    const t = setTimeout(() => setShown((n) => n + 1), 1200)
    return () => clearTimeout(t)
  }, [shown, execution.steps.length])

  return (
    <Stack gap={3}>
      <h2>Execution</h2>
      <ListGroup>
        {execution.steps.slice(0, shown).map((s, i) => (
          <ListGroup.Item key={i} className="d-flex justify-content-between align-items-center">
            <span>
              {nameOf(s.from)} → {nameOf(s.to)}: {s.description}
            </span>
            <span>
              <strong className={s.effect < 0 ? "text-danger" : s.effect > 0 ? "text-success" : ""}>
                {s.effect > 0 ? `+${s.effect}` : s.effect}
              </strong>{" "}
              → {s.coinAfter} coins
            </span>
          </ListGroup.Item>
        ))}
      </ListGroup>
    </Stack>
  )
}

// Minimal result view
// TODO: Polish 
function ResultView({ execution, onPlayAgain }) {
  return (
    <Card body className="text-center my-4">
      <h2>Result</h2>
      {!execution.valid && (
        <p className="text-danger">
          Route invalid{execution.reason ? `: ${execution.reason}` : ""}. You lost all your coins.
        </p>
      )}
      <p className="display-4">{execution.finalScore} coins</p>
      <div>
        <Button onClick={onPlayAgain}>Play again</Button>
      </div>
    </Card>
  )
}

export default GameView

import { useCallback, useMemo, useRef, useState } from "react"
import { Alert } from "react-bootstrap"

import { getSegmentList, getStations, startGame, submitRoute } from "../api/api"
import SetupView from "./SetupView"
import PlanningView from "./PlanningView"
import ExecutionView from "./ExecutionView"
import ResultView from "./ResultView"

// Drives the main game flow and state:
//   setup → planning → executing → result → (Play again) → setup
function GameView() {
  const [phase, setPhase] = useState("setup") // setup | planning | executing | result
  const [game, setGame] = useState(null)
  const [stations, setStations] = useState([]) // lean stations: {id, name, x, y}
  const [segments, setSegments] = useState([]) // bare pairs: {id, a, b}
  const [route, setRoute] = useState([])
  const [execution, setExecution] = useState(null)
  const [starting, setStarting] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")
  const submitted = useRef(false) // to avoid double submissions

  const nameById = useMemo(() => {
    const m = new Map(stations.map((s) => [s.id, s.name]))
    return (id) => m.get(id) ?? `Station #${id}`
  }, [stations])

  const beginGame = async () => {
    setError("")
    setStarting(true)
    try {
      const [g, leanStations, segmentList] = await Promise.all([
        startGame(),
        getStations(),
        getSegmentList(),
      ])
      setGame(g)
      setStations(leanStations)
      setSegments(segmentList)
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
    setStations([])
    setSegments([])
    setRoute([])
    setExecution(null)
    setPhase("setup")
  }

  return (
    <div className="my-3">
      {error && (
        <Alert variant="danger" dismissible onClose={() => setError("")}>
          {error}
        </Alert>
      )}

      {phase === "setup" && <SetupView onStart={beginGame} starting={starting} />}

      {phase === "planning" && game && (
        <PlanningView
          stations={stations}
          segments={segments}
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

      {(phase === "executing" || phase === "result") && execution && execution.steps.length > 0 && (
        <ExecutionView execution={execution} nameOf={nameById} onDone={() => setPhase("result")} />
      )}

      {phase === "result" && execution && (
        <ResultView execution={execution} onPlayAgain={playAgain} />
      )}
    </div>
  )
}

export default GameView

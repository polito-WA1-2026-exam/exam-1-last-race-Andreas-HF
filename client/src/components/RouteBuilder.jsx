import { Button, Badge, Stack } from "react-bootstrap"
import SegmentList from "./SegmentList"

// Builds the route from segments. Connectivity (a walk: each segment continues
// from the previous one's end) is enforced here because it is deducible from the
// segments alone. Line-change rules are NOT checked client-side — the player
// must remember line affiliations from Setup; the server validates them.

// Displays the current route as a list of station names, with buttons to undo/reset.
// Also enforces connectivity by only allowing segments that continue from the current route tail.
function RouteBuilder({ start, dest, segments, route, nameOf, onAdd, onUndo, onReset, onSubmit, submitting }) {
  const tailId = route.length ? route[route.length - 1].b : start.id
  const complete = tailId === dest.id

  return (
    <Stack gap={3}>
      <div>
        <div className="mb-1 text-muted">Your route</div>
        <div className="d-flex flex-wrap align-items-center gap-2">
          <Badge bg="success">{start.name}</Badge>
          {route.map((s, i) => (
            <span key={`${s.id}-${i}`} className="d-flex align-items-center gap-2">
              <span>→</span>
              <Badge bg={s.b === dest.id ? "danger" : "primary"}>{nameOf(s.b)}</Badge>
            </span>
          ))}
          {!complete && (
            <>
              <span>→</span>
              <Badge bg="light" text="dark">{dest.name}?</Badge>
            </>
          )}
        </div>
        {complete && <div className="text-success mt-1">Route reaches the destination.</div>}
      </div>

      <div className="d-flex gap-2">
        <Button variant="outline-secondary" size="sm" disabled={route.length === 0} onClick={onUndo}>
          Undo
        </Button>
        <Button variant="outline-secondary" size="sm" disabled={route.length === 0} onClick={onReset}>
          Reset
        </Button>
        <Button variant="primary" size="sm" className="ms-auto" disabled={submitting} onClick={onSubmit}>
          {submitting ? "Submitting…" : "Submit route"}
        </Button>
      </div>

      <SegmentList segments={segments} route={route} tailId={tailId} nameOf={nameOf} onAdd={onAdd} />
    </Stack>
  )
}

export default RouteBuilder

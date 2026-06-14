import { Button, Badge, Stack } from "react-bootstrap"
import SegmentList from "./SegmentList"

// Displays the current route as the ordered list of segments the player picked.
// Any segment can be added in any order — the server decides if the route is valid.
function RouteBuilder({ start, dest, segments, route, nameOf, onAdd, onUndo, onReset, onSubmit, submitting }) {
  return (
    <Stack gap={3}>
      <div>
        <div className="mb-1 text-muted">
          From <Badge bg="success">{start.name}</Badge> to <Badge bg="danger">{dest.name}</Badge>
        </div>
        <div className="mb-1 text-muted">Your route</div>
        {route.length === 0 ? (
          <div className="text-muted fst-italic">No segments selected yet.</div>
        ) : (
          <Stack gap={1}>
            {route.map((s, i) => (
              <div key={`${s.id}-${i}`} className="d-flex align-items-center gap-2">
                <span className="text-muted">{i + 1}.</span>
                <Badge bg="light" text="dark">{nameOf(s.a)}</Badge>
                <span>→</span>
                <Badge bg="light" text="dark">{nameOf(s.b)}</Badge>
              </div>
            ))}
          </Stack>
        )}
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

      <SegmentList segments={segments} route={route} nameOf={nameOf} onAdd={onAdd} />
    </Stack>
  )
}

export default RouteBuilder

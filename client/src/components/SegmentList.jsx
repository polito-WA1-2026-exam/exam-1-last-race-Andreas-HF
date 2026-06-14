import { ListGroup, Badge } from "react-bootstrap"

// Shows the list of all segments as buttons to add to the route.
// Any unused segment can be selected, in any order — the server validates
// connectivity and ordering. Already-used segments are disabled, since a
// segment may be used only once.
function SegmentList({ segments, route, nameOf, onAdd }) {
  const usedIds = new Set(route.map((s) => s.id))

  return (
    <ListGroup style={{ maxHeight: "55vh", overflowY: "auto" }}>
      {segments.map((seg) => {
        const used = usedIds.has(seg.id)
        return (
          <ListGroup.Item
            key={seg.id}
            action={!used}
            disabled={used}
            onClick={used ? undefined : () => onAdd(seg)}
            className="d-flex justify-content-between align-items-center"
          >
            <span>
              {nameOf(seg.a)} — {nameOf(seg.b)}
            </span>
            {used && <Badge bg="secondary">used</Badge>}
          </ListGroup.Item>
        )
      })}
    </ListGroup>
  )
}

export default SegmentList

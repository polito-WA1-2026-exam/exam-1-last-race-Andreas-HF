import { ListGroup, Badge } from "react-bootstrap"

// Shows the list of all segments as buttons to add to the route.
// Only unused segments that connect to the current route tail are clickable.
function SegmentList({ segments, route, tailId, nameOf, onAdd }) {
  const usedIds = new Set(route.map((s) => s.id))

  return (
    <ListGroup style={{ maxHeight: "55vh", overflowY: "auto" }}>
      {segments.map((seg) => {
        const used = usedIds.has(seg.id)
        const connectable = seg.a === tailId || seg.b === tailId
        const disabled = used || !connectable
        return (
          <ListGroup.Item
            key={seg.id}
            action={!disabled}
            disabled={disabled}
            onClick={disabled ? undefined : () => onAdd(seg)}
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

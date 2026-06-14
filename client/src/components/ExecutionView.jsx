import { useEffect, useRef, useState } from "react"
import { ListGroup, Stack } from "react-bootstrap"

const STEP_TIME = 2000

// Execution view: shows the steps of execution one by one
function ExecutionView({ execution, nameOf, onDone }) {
  const [shown, setShown] = useState(0)
  const onDoneRef = useRef(onDone)

  useEffect(() => {
    onDoneRef.current = onDone
  })

  useEffect(() => {
    if (shown >= execution.steps.length) {
      const t = setTimeout(() => onDoneRef.current(), STEP_TIME)
      return () => clearTimeout(t)
    }
    const t = setTimeout(() => setShown((n) => n + 1), STEP_TIME)
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

export default ExecutionView

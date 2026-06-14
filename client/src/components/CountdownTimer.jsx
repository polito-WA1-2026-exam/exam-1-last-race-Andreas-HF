import { useEffect, useRef, useState } from "react"
import { ProgressBar } from "react-bootstrap"


function CountdownTimer({ durationSeconds, onExpire }) {
  const [remaining, setRemaining] = useState(durationSeconds)
  const onExpireRef = useRef(onExpire)
  const fired = useRef(false)

  // Keep the latest callback in a ref without re-creating the timer.
  useEffect(() => {
    onExpireRef.current = onExpire
  })

  useEffect(() => {
    if (remaining <= 0) return
    const t = setTimeout(() => setRemaining((r) => r - 1), 1000)
    return () => clearTimeout(t)
  }, [remaining])

  useEffect(() => {
    if (remaining <= 0 && !fired.current) {
      fired.current = true
      onExpireRef.current()
    }
  }, [remaining])

  const pct = Math.max(0, (remaining / durationSeconds) * 100)
  const variant = remaining <= 10 ? "danger" : remaining <= 30 ? "warning" : "success"

  return (
    <div className="mb-3">
      <div className="d-flex justify-content-between">
        <strong>Time left</strong>
        <strong>{Math.max(0, remaining)}s</strong>
      </div>
      <ProgressBar now={pct} variant={variant} animated={remaining > 0} />
    </div>
  )
}

export default CountdownTimer

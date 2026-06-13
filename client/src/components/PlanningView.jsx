import { Row, Col, Card } from "react-bootstrap"
import NetworkMap from "./NetworkMap"
import CountdownTimer from "./CountdownTimer"
import RouteBuilder from "./RouteBuilder"

// Network map with only stations and the start/dest highlighted as well as a timer
function PlanningView({ network, game, route, nameOf, onAdd, onUndo, onReset, onSubmit, submitting }) {
  const { startStation: start, destStation: dest, segments, durationSeconds } = game

  return (
    <>
      <h2>Planning</h2>
      <CountdownTimer key={game.gameId} durationSeconds={durationSeconds} onExpire={onSubmit} />
      <div className="mb-3">
        From <strong className="text-success">{start.name}</strong> to{" "}
        <strong className="text-danger">{dest.name}</strong>. Build a route using the segments -
        each segment only once.
      </div>
      <Row>
        <Col md={7} className="mb-3">
          <NetworkMap stations={network.stations} startId={start.id} destId={dest.id} />
        </Col>
        <Col md={5}>
          <Card body>
            <RouteBuilder
              start={start}
              dest={dest}
              segments={segments}
              route={route}
              nameOf={nameOf}
              onAdd={onAdd}
              onUndo={onUndo}
              onReset={onReset}
              onSubmit={onSubmit}
              submitting={submitting}
            />
          </Card>
        </Col>
      </Row>
    </>
  )
}

export default PlanningView

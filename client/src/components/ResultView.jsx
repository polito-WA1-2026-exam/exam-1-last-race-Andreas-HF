import { Button, Card } from "react-bootstrap"

// Result view: shows the final score and a button to start a new game
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

export default ResultView

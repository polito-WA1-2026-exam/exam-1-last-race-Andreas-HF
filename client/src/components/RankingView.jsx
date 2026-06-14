import { useContext, useEffect, useState } from "react"
import { Alert, Spinner, Stack, Table } from "react-bootstrap"

import { getRanking } from "../api/api"
import UserContext from "../contexts/UserContext"

// Ranking page: each user's best score across all completed games, descending.
function RankingView() {
  const user = useContext(UserContext)
  const [ranking, setRanking] = useState(null) // [{name, bestScore}]
  const [error, setError] = useState("")

  useEffect(() => {
    getRanking()
      .then(setRanking)
      .catch((e) => setError(e.message))
  }, [])

  if (error) return <Alert variant="danger">{error}</Alert>
  if (!ranking) return <Spinner animation="border" className="mt-4" />

  return (
    <Stack gap={3} className="my-3">
      <h2>Ranking</h2>
      {ranking.length === 0 ? (
        <p className="text-muted">No games have been played yet.</p>
      ) : (
        <Table striped bordered hover>
          <thead>
            <tr>
              <th style={{ width: "4rem" }}>#</th>
              <th>Player</th>
              <th className="text-end">Best score</th>
            </tr>
          </thead>
          <tbody>
            {ranking.map((row, i) => (
              <tr key={`${row.name}-${i}`} className={row.name === user?.name ? "table-primary" : ""}>
                <td>{i + 1}</td>
                <td>{row.name}</td>
                <td className="text-end">{row.bestScore} coins</td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </Stack>
  )
}

export default RankingView

import { db } from './db.js';

export function createGame(userId, startId, destId, startedAt) {
  return new Promise((resolve, reject) => {
    const sql = `INSERT INTO games (user_id, start_id, dest_id, started_at, status)
                 VALUES (?, ?, ?, ?, 'planning')`;
    db.run(sql, [userId, startId, destId, startedAt], function (err) {
      if (err) reject(err);
      else resolve(this.lastID);
    });
  });
}

export function getGame(gameId) {
  return new Promise((resolve, reject) => {
    db.get(`SELECT id, user_id, start_id, dest_id, started_at, submitted_at, status, final_score
            FROM games WHERE id = ?`, [gameId],
      (err, row) => err ? reject(err) : resolve(row));
  });
}

export function listEvents() {
  return new Promise((resolve, reject) => {
    db.all(`SELECT id, description, effect FROM events ORDER BY id`, [],
      (err, rows) => err ? reject(err) : resolve(rows));
  });
}

export function listGamesByUser(userId) {
  return new Promise((resolve, reject) => {
    db.all(
      `SELECT id, start_id, dest_id, started_at, submitted_at, status, final_score
       FROM games WHERE user_id = ? ORDER BY started_at DESC`,
      [userId],
      (err, rows) => err ? reject(err) : resolve(rows));
  });
}

// Set up a transaction to update everything together, so we don't end up with a game marked 
// as done but missing steps if something fails 
export function finalizeGame(gameId, submittedAt, finalScore, steps) {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      db.run('BEGIN TRANSACTION');
      let failed = false;

      db.run(
        `UPDATE games SET status='done', submitted_at=?, final_score=? WHERE id=?`,
        [submittedAt, finalScore, gameId],
        (err) => { if (err) { failed = true; reject(err); } }
      );

      const stepStmt = db.prepare(
        `INSERT INTO game_steps (game_id, step_index, from_id, to_id, event_id, effect, coin_after)
         VALUES (?, ?, ?, ?, ?, ?, ?)`
      );
      for (const s of steps) {
        stepStmt.run(gameId, s.stepIndex, s.fromId, s.toId, s.eventId, s.effect, s.coinAfter,
          (err) => { if (err) { failed = true; reject(err); } });
      }
      stepStmt.finalize((err) => {
        if (err) { failed = true; reject(err); }
        if (failed) db.run('ROLLBACK');
        else db.run('COMMIT', (err2) => err2 ? reject(err2) : resolve());
      });
    });
  });
}

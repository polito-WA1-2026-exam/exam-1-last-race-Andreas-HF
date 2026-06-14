import { db } from './db.js';
import { Station, Line } from './models.js';

export function getFullNetwork() {
  return new Promise((resolve, reject) => {
    const stationsSql = `SELECT s.id, s.name, s.x, s.y,
        (SELECT COUNT(DISTINCT ls.line_id) FROM line_stops ls
          WHERE ls.station_id = s.id) AS line_count
        FROM stations s ORDER BY s.id`;
    const linesSql = `SELECT id, name, color FROM lines ORDER BY id`;
    const stopsSql = `SELECT line_id, station_id, position
                        FROM line_stops ORDER BY line_id, position`;

    Promise.all([
      new Promise((res, rej) => db.all(stationsSql, [], (e, r) => e ? rej(e) : res(r))),
      new Promise((res, rej) => db.all(linesSql,    [], (e, r) => e ? rej(e) : res(r))),
      new Promise((res, rej) => db.all(stopsSql,    [], (e, r) => e ? rej(e) : res(r))),
    ]).then(([stationRows, lineRows, stopRows]) => {
      const stations = stationRows.map(r =>
        new Station(r.id, r.name, r.x, r.y, r.line_count >= 2));
      const stopsByLine = new Map();
      for (const s of stopRows) {
        if (!stopsByLine.has(s.line_id)) stopsByLine.set(s.line_id, []);
        stopsByLine.get(s.line_id).push(s.station_id);
      }
      const lines = lineRows.map(l =>
        new Line(l.id, l.name, l.color, stopsByLine.get(l.id) ?? []));
      resolve({ stations, lines });
    }).catch(reject);
  });
}

export function getStations() {
  return new Promise((resolve, reject) => {
    db.all(`SELECT id, name, x, y FROM stations ORDER BY id`, [],
      (err, rows) => err
        ? reject(err)
        : resolve(rows.map(r => new Station(r.id, r.name, r.x, r.y))));
  });
}

export function getSegments() {
  return new Promise((resolve, reject) => {
    const sql = `
      SELECT DISTINCT
        MIN(a.station_id, b.station_id) AS a,
        MAX(a.station_id, b.station_id) AS b
      FROM line_stops a
      JOIN line_stops b
        ON a.line_id = b.line_id AND b.position = a.position + 1
      ORDER BY a, b`;
    db.all(sql, [], (err, rows) => {
      if (err) return reject(err);
      resolve(rows.map(r => ({ id: `${r.a}-${r.b}`, a: r.a, b: r.b })));
    });
  });
}
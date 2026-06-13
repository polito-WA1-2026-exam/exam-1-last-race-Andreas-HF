import sqlite from "sqlite3";
export const db = new sqlite.Database("lastrace.sqlite", (err) => {
  if (err) throw err;
});
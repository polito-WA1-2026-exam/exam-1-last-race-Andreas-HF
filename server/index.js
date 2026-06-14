// imports
import express from "express";
import morgan from "morgan";
import cors from "cors";
import { getUser } from "./dao-users.js"
import { getFullNetwork, getStations, getSegments } from "./dao-network.js";
import { createGame, getGame, listEvents, finalizeGame, getRanking } from "./dao-games.js";
import { buildNetworkIndex, pickEndpoints, validateRoute, executeRoute } from "./game-logic.js";

import passport from "passport";
import LocalStrategy from "passport-local";
import session from "express-session";
import { check, body, param, validationResult } from "express-validator";
import dayjs from "dayjs";

// init express
const app = new express();
const port = 3001;

// middleware
app.use(express.json());
app.use(morgan("dev"));

const corsOptions = {
  origin: 'http://localhost:5173',
  optionsSuccessStatus: 200,
  credentials: true
};
app.use(cors(corsOptions));

app.use(session({
  secret: "very$ecret@!",
  resave: false,
  saveUninitialized: false,
}));
app.use(passport.authenticate("session"));

passport.use(new LocalStrategy(async function verify(username, password, cb) {
  const user = await getUser(username, password);
  
  if(!user)
    return cb(null, false, "Incorrect username or password.");
    
  return cb(null, user);
}));

passport.serializeUser(function (user, cb) {
  cb(null, user);
});

passport.deserializeUser(function (user, cb) {
  return cb(null, user);
});

const isLoggedIn = (req, res, next) => {
  if (req.isAuthenticated()) return next();
  return res.status(401).json({ error: "Not authorized" });
};

// Cache at boot, since this data should not change when the server is running
const networkIndex = buildNetworkIndex(await getFullNetwork());
const eventsCache = await listEvents();
const stationById = new Map(networkIndex.stations.map(s => [s.id, s]));

const GAME_DURATION_SECONDS = 90;
const TIMER_GRACE_SECONDS = 5;

// Routes

app.post("/api/sessions", [
  check("username").notEmpty(),
  check("password").notEmpty(),
], (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });
  return next();
}, passport.authenticate("local"), function(req, res) {
  return res.status(201).json(req.user);
});

app.get("/api/sessions/current", (req, res) => {
  if (req.isAuthenticated()) return res.json(req.user);
  return res.status(401).json({ error: "Not authenticated" });
});

app.delete("/api/sessions/current", (req, res) => {
  req.logout((err) => {
    if (err) return res.status(503).json({ error: "Logout failed" });
    res.end();
  });
});

app.get("/api/network/full", isLoggedIn, (req, res) => {
  getFullNetwork().then((network) => {
    res.json(network);
  }).catch((err) => {
    console.error(err);
    res.status(503).json({ error: "Failed to fetch network data" });
  });
});

app.get("/api/network/stations", isLoggedIn, (req, res) => {
  getStations().then((stations) => {
    res.json(stations);
  }).catch((err) => {
    console.error(err);
    res.status(503).json({ error: "Failed to fetch stations" });
  });
});

app.get("/api/network/segments", isLoggedIn, (req, res) => {
  getSegments().then((segments) => {
    res.json(segments);
  }).catch((err) => {
    console.error(err);
    res.status(503).json({ error: "Failed to fetch segments" });
  });
});

app.post("/api/games", isLoggedIn, async (req, res) => {
  try {
    const { startId, destId } = pickEndpoints(networkIndex);
    const startedAt = dayjs().toISOString();
    const gameId = await createGame(req.user.id, startId, destId, startedAt);
    res.status(201).json({
      gameId,
      startStation: stationById.get(startId),
      destStation: stationById.get(destId),
      startedAt,
      durationSeconds: GAME_DURATION_SECONDS,
    });
  } catch (err) {
    console.error(err);
    res.status(503).json({ error: "Failed to start game" });
  }
});

app.post("/api/games/:id/submit",
  isLoggedIn,
  [
    param("id").isInt(),
    body("route").isArray(),
    body("route.*.a").isInt(),
    body("route.*.b").isInt(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });

    const gameId = parseInt(req.params.id, 10);
    try {
      const game = await getGame(gameId);
      if (!game) return res.status(404).json({ error: "Game not found" });
      if (game.user_id !== req.user.id) return res.status(403).json({ error: "Not your game" });
      if (game.status !== 'planning') return res.status(409).json({ error: "Game already submitted" });

      const submittedAt = dayjs().toISOString();
      const elapsed = dayjs(submittedAt).diff(game.started_at, 'second');
      const timedOut = elapsed > GAME_DURATION_SECONDS + TIMER_GRACE_SECONDS;

      const route = req.body.route.map(s => ({ a: Number(s.a), b: Number(s.b) }));
      const validation = timedOut
        ? { ok: false, reason: 'Time expired' }
        : validateRoute(networkIndex, game.start_id, game.dest_id, route);

      let steps = [];
      let finalScore = 0;
      if (validation.ok) {
        const result = executeRoute(route, eventsCache);
        steps = result.steps;
        finalScore = result.finalScore;
      }

      await finalizeGame(gameId, submittedAt, finalScore, steps);

      return res.json({
        valid: validation.ok,
        ...(validation.ok ? {} : { reason: validation.reason }),
        steps: steps.map(s => ({
          stepIndex: s.stepIndex,
          from: s.fromId,
          to: s.toId,
          description: s.description,
          effect: s.effect,
          coinAfter: s.coinAfter,
        })),
        finalScore,
      });
    } catch (err) {
      console.error(err);
      return res.status(503).json({ error: "Failed to submit game" });
    }
  });

app.get("/api/ranking", isLoggedIn, (req, res) => {
  getRanking().then((ranking) => {
    res.json(ranking);
  }).catch((err) => {
    console.error(err);
    res.status(503).json({ error: "Failed to fetch ranking" });
  });
});

// activate the server
app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});

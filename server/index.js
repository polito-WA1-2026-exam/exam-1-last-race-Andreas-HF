// imports
import express from "express";
import morgan from "morgan";
import cors from "cors";
import { getUser } from "./dao-users.js"
import { getFullNetwork, getStations, getSegments } from "./dao-network.js";

import passport from "passport";
import LocalStrategy from "passport-local";
import session from "express-session";
import { check, validationResult } from "express-validator";

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

// Routes

app.get("/api/health", (req, res) => {
  return res.status(200).send("UP")
});

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

// activate the server
app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});

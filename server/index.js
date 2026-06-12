// imports
import express from "express";
import morgan from "morgan";
import cors from "cors";
import { getUser } from "./dao-users.js"

import passport from "passport";
import LocalStrategy from "passport-local";
import session from "express-session";

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

// Routes

app.get("/api/health", (req, res) => {
  return res.status(200).send("UP")
});

app.post("/api/sessions", passport.authenticate("local"), function(req, res) {
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

// activate the server
app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});

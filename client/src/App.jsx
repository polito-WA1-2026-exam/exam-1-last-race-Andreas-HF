import 'bootstrap/dist/css/bootstrap.min.css'

import { useCallback, useEffect, useState } from 'react'
import { Container } from 'react-bootstrap'
import { Navigate, Outlet, Route, Routes, useNavigate } from 'react-router'

import Header from './components/Header'
import { LoginForm, Logout } from './components/LoginForm'
import GameView from './components/GameView'
import RankingView from './components/RankingView'
import UserContext from './contexts/UserContext'
import { checkSession } from './api/auth'

const ANON_USER = { id: undefined, username: undefined, name: undefined }

function App() {
  const [user, setUser] = useState(ANON_USER)
  const navigate = useNavigate()

  // Try to restore session on reload
  useEffect(() => {
    checkSession().then((u) => {
      if (u) setUser({ id: u.id, username: u.username, name: u.name })
    })
  }, [])

  // Called by both login and logout 
  const doLogin = useCallback((u) => {
    setUser({ id: u.id, username: u.username, name: u.name })
    if (u.id) navigate('/play')
  }, [navigate])

  return (
    <UserContext.Provider value={user}>
      <Routes>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<Instructions />} />
          <Route path="login" element={
            user.id ? <Navigate to="/play" replace /> : <LoginForm doLogin={doLogin} />
          } />
          <Route path="logout" element={<Logout doLogin={doLogin} />} />
          <Route path="play" element={<Protected user={user}><GamePage /></Protected>} />
          <Route path="ranking" element={<Protected user={user}><RankingPage /></Protected>} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </UserContext.Provider>
  )
}

function MainLayout() {
  return (
    <>
      <Header />
      <Container fluid="lg">
        <Outlet />
      </Container>
    </>
  )
}

function Protected({ user, children }) {
  if (!user?.id) return <Navigate to="/login" replace />
  return children
}


// Placeholder views

function Instructions() {
  return (
    <>
      <h2>How to play</h2>
      <p>
        Try to find your way from one station to another using the metro lines. Try to get as many coins as possible while doing so! 
      </p>
      <p className="text-muted">
        Log in to view the network map and start a game.
      </p>
    </>
  )
}

function GamePage() {
  return <GameView />
}

function RankingPage() {
  return <RankingView />
}

function NotFound() {
  return <h2>Page not found</h2>
}

export default App

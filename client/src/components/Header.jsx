import { useContext } from "react"
import { Button, Container, Nav, Navbar } from "react-bootstrap"
import { Link, useNavigate } from "react-router"

import UserContext from "../contexts/UserContext"

function Header() {
  const user = useContext(UserContext)
  const loggedIn = Boolean(user?.id)

  return (
    <Navbar bg="dark" data-bs-theme="dark" className="mb-3">
      <Container fluid>
        <Navbar.Brand as={Link} to="/">Last Race</Navbar.Brand>
        <Nav className="me-auto">
          {loggedIn && <Nav.Link as={Link} to="/play">Play</Nav.Link>}
          {loggedIn && <Nav.Link as={Link} to="/ranking">Ranking</Nav.Link>}
        </Nav>
        <div>{loggedIn ? <UserInfo name={user.name} /> : <LoginButton />}</div>
      </Container>
    </Navbar>
  )
}

function LoginButton() {
  const navigate = useNavigate()
  return <Button variant="light" onClick={() => navigate("/login")}>Log in</Button>
}

function UserInfo({ name }) {
  return (
    <div className="d-flex align-items-center gap-3 text-white">
      <span>Hi, {name}</span>
      <Link to="/logout" className="text-white">Logout</Link>
    </div>
  )
}

export default Header

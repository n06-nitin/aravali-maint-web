import { Link, useLocation } from 'react-router-dom'
import { supabase } from '../supabaseClient'

export default function Navbar({ isStaff }) {
  const { pathname } = useLocation()
  const is = (p) => (pathname === p ? 'nav-link active' : 'nav-link')

  return (
    <header className="navbar">
      <Link to="/" className="brand">
        <span className="brand-mark">A</span>
        <span className="brand-text">Aravali <em>Maintenance</em></span>
      </Link>

      <nav className="nav-links">
        <Link className={is('/')} to="/">Home</Link>
        <Link className={is('/ongoing')} to="/ongoing">Ongoing</Link>
        <Link className={is('/add')} to="/add">Add Problem</Link>
        {isStaff ? (
          <button className="nav-link ghost" onClick={() => supabase.auth.signOut()}>
            Log out
          </button>
        ) : (
          <Link className="nav-link ghost" to="/login">Staff login</Link>
        )}
      </nav>
    </header>
  )
}

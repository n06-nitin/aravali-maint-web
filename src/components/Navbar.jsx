import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { supabase } from '../supabaseClient'

export default function Navbar({ isStaff }) {
  const { pathname } = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)

  // Auto-close drawer on route navigation
  useEffect(() => {
    setMenuOpen(false)
  }, [pathname])

  // Close on Escape key
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape') setMenuOpen(false)
    }
    if (menuOpen) {
      window.addEventListener('keydown', handleKeyDown)
    }
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [menuOpen])

  const is = (p) => (pathname === p ? 'nav-link active' : 'nav-link')
  const isPolls = pathname.startsWith('/polls') ? 'nav-link active' : 'nav-link'

  const isMob = (p) => (pathname === p ? 'mobile-nav-link active' : 'mobile-nav-link')
  const isMobPolls = pathname.startsWith('/polls') ? 'mobile-nav-link active' : 'mobile-nav-link'

  return (
    <header className="navbar-container">
      <div className="navbar">
        <Link to="/" className="brand" onClick={() => setMenuOpen(false)}>
          <span className="brand-mark">A</span>
          <span className="brand-text">Aravali <em>Maintenance</em></span>
        </Link>

        {/* Desktop navigation */}
        <nav className="nav-links desktop-nav">
          <Link className={is('/')} to="/">Home</Link>
          <Link className={is('/ongoing')} to="/ongoing">Ongoing</Link>
          <Link className={is('/add')} to="/add">Add Problem</Link>
          <Link className={isPolls} to="/polls">Polls</Link>
          {isStaff ? (
            <button className="nav-link ghost" onClick={() => supabase.auth.signOut()}>
              Log out
            </button>
          ) : (
            <Link className="nav-link ghost" to="/login">Staff login</Link>
          )}
        </nav>

        {/* Mobile menu toggle */}
        <button
          className={`nav-toggle ${menuOpen ? 'open' : ''}`}
          onClick={() => setMenuOpen((v) => !v)}
          aria-label={menuOpen ? 'Close menu' : 'Open navigation menu'}
          aria-expanded={menuOpen}
        >
          <span className="nav-toggle-bar" />
          <span className="nav-toggle-bar" />
          <span className="nav-toggle-bar" />
        </button>
      </div>

      {/* Mobile drawer navigation */}
      {menuOpen && (
        <div className="mobile-nav-backdrop" onClick={() => setMenuOpen(false)}>
          <nav className="mobile-nav" onClick={(e) => e.stopPropagation()}>
            <Link className={isMob('/')} to="/">
              <span className="mob-icon">🏠</span> Home
            </Link>
            <Link className={isMob('/ongoing')} to="/ongoing">
              <span className="mob-icon">📋</span> Ongoing Problems
            </Link>
            <Link className={isMob('/add')} to="/add">
              <span className="mob-icon">➕</span> Add a Problem
            </Link>
            <Link className={isMobPolls} to="/polls">
              <span className="mob-icon">🗳️</span> Hostel Polls
            </Link>

            <div className="mobile-nav-divider" />

            {isStaff ? (
              <button
                className="mobile-nav-link staff-action"
                onClick={() => {
                  supabase.auth.signOut()
                  setMenuOpen(false)
                }}
              >
                <span className="mob-icon">🚪</span> Log out (Staff)
              </button>
            ) : (
              <Link className="mobile-nav-link staff-action" to="/login">
                <span className="mob-icon">🔐</span> Staff Login
              </Link>
            )}
          </nav>
        </div>
      )}
    </header>
  )
}

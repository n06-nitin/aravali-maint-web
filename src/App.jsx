import { useState, useEffect } from 'react'
import { Routes, Route } from 'react-router-dom'
import { supabase } from './supabaseClient'
import Navbar from './components/Navbar'
import Home from './pages/Home'
import AddProblem from './pages/AddProblem'
import Ongoing from './pages/Ongoing'
import Login from './pages/Login'

export default function App() {
  const [session, setSession] = useState(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => setSession(s))
    return () => sub.subscription.unsubscribe()
  }, [])

  const isStaff = !!session

  return (
    <div className="app">
      <Navbar isStaff={isStaff} />
      <main className="container">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/add" element={<AddProblem />} />
          <Route path="/ongoing" element={<Ongoing isStaff={isStaff} />} />
          <Route path="/login" element={<Login />} />
        </Routes>
      </main>
      <footer className="footer">Aravali Hostel · Maintenance Portal</footer>
    </div>
  )
}

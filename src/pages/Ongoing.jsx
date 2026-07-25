import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import { STATUSES } from '../constants'
import CategoryFilter from '../components/CategoryFilter'
import ProblemCard from '../components/ProblemCard'

export default function Ongoing({ isStaff }) {
  const [problems, setProblems] = useState([])
  const [loading, setLoading] = useState(true)
  const [category, setCategory] = useState('all')
  const [search, setSearch] = useState('')

  async function load() {
    setLoading(true)
    const { data, error } = await supabase
      .from('problems')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) console.error(error)
    setProblems(data || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  // Update or remove a single card locally — no full reload, feels instant
  const applyUpdate = (id, patch) =>
    setProblems((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)))
  const applyDelete = (id) =>
    setProblems((prev) => prev.filter((p) => p.id !== id))

  const q = search.trim().toLowerCase()
  const filtered = problems.filter((p) => {
    const catOk = category === 'all' || p.category === category
    const searchOk =
      !q ||
      p.description?.toLowerCase().includes(q) ||
      p.name?.toLowerCase().includes(q) ||
      p.location?.toLowerCase().includes(q)
    return catOk && searchOk
  })

  const count = (key) => problems.filter((p) => p.status === key).length

  return (
    <div className="ongoing">
      <div className="ongoing-head">
        <div>
          <p className="eyebrow">Live board</p>
          <h1 className="page-title">Ongoing Problems</h1>
        </div>
        <div className="legend">
          {Object.entries(STATUSES).map(([key, val]) => (
            <span key={key} className="legend-item">
              <span className="dot" style={{ background: val.color }} />
              {val.label} <b>{count(key)}</b>
            </span>
          ))}
        </div>
      </div>

      <div className="toolbar">
        <CategoryFilter value={category} onChange={setCategory} />
        <div className="search">
          <span className="search-icon">⌕</span>
          <input placeholder="Search" value={search}
            onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      {loading ? (
        <p className="hint">Loading…</p>
      ) : filtered.length === 0 ? (
        <div className="empty">
          <p>Nothing here yet.</p>
          <span>When someone reports an issue in this category, it shows up here.</span>
        </div>
      ) : (
        <div className="cards">
          {filtered.map((p) => (
            <ProblemCard
              key={p.id}
              problem={p}
              isStaff={isStaff}
              onUpdate={applyUpdate}
              onDelete={applyDelete}
            />
          ))}
        </div>
      )}
    </div>
  )
}
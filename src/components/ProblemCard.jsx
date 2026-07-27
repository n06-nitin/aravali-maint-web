import { useState } from 'react'
import { supabase } from '../supabaseClient'
import { STATUSES, categoryLabel, serviceLabel } from '../constants'
import StatusBadge from './StatusBadge'

export default function ProblemCard({ problem, isStaff, onUpdate, onDelete }) {
  const [busy, setBusy] = useState(false)
  const [open, setOpen] = useState(false)
  const s = STATUSES[problem.status] || STATUSES.new

  async function setStatus(status) {
    setBusy(true)
    const patch = {
      status,
      resolved_at: status === 'resolved' ? new Date().toISOString() : null,
    }
    const { error } = await supabase.from('problems').update(patch).eq('id', problem.id)
    setBusy(false)
    if (error) { alert('Could not update: ' + error.message); return }
    onUpdate(problem.id, patch) // update just this card, no full reload
  }

  async function handleDelete() {
    if (!window.confirm('Delete this problem permanently? This cannot be undone.')) return
    setBusy(true)
    // Best-effort: remove attached photos from storage
    const paths = (problem.photo_urls || [])
      .map((u) => u.split('/problem-photos/')[1])
      .filter(Boolean)
    if (paths.length) await supabase.storage.from('problem-photos').remove(paths)

    const { error } = await supabase.from('problems').delete().eq('id', problem.id)
    setBusy(false)
    if (error) { alert('Could not delete: ' + error.message); return }
    onDelete(problem.id) // remove just this card, no full reload
  }

  const when = new Date(problem.created_at).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short',
  })
  const stop = (e) => e.stopPropagation()

  return (
    <article
      className={`card ${open ? 'open' : ''}`}
      style={{ '--spine': s.color }}
      onClick={() => setOpen((v) => !v)}
    >
      {/* --- Always visible: the basics --- */}
      <div className="card-head">
        <span className="cat-tag">{categoryLabel(problem.category)}</span>
        <span className="cat-tag">{serviceLabel(problem.service_type)}</span>
        <StatusBadge status={problem.status} />
      </div>

      <p className={`card-desc ${open ? '' : 'clamp'}`}>{problem.description}</p>

      <p className="card-meta muted">
        {problem.name} · {problem.entry_no} · {when}
        {problem.photo_urls?.length > 0 && ` · ${problem.photo_urls.length} photo(s)`}
      </p>

      {/* --- Revealed on click: everything else --- */}
      {open && (
        <div className="card-details" onClick={stop}>
          {problem.location && <p className="card-meta">📍 {problem.location}</p>}
          <p className="card-meta">📞 {problem.phone}</p>

          {problem.photo_urls?.length > 0 && (
            <div className="card-photos">
              {problem.photo_urls.map((u, i) => (
                <a key={i} href={u} target="_blank" rel="noreferrer">
                  <img src={u} alt="attached" loading="lazy" />
                </a>
              ))}
            </div>
          )}

          {isStaff && (
            <div className="status-actions">
              <span className="actions-label">Set status</span>
              {Object.entries(STATUSES).map(([key, val]) => (
                <button
                  key={key}
                  disabled={busy || problem.status === key}
                  className="status-btn"
                  style={{ '--c': val.color }}
                  onClick={() => setStatus(key)}
                >
                  {val.label}
                </button>
              ))}
              <button className="delete-btn" disabled={busy} onClick={handleDelete}>
                Delete
              </button>
            </div>
          )}
        </div>
      )}

      <span className="expand-hint">{open ? 'Show less ▲' : 'View details ▼'}</span>
    </article>
  )
}
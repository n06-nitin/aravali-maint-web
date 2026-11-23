import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { fetchAllPolls, updatePollStatus, deletePoll } from '../services/pollsService'
import ImageModal from '../components/ImageModal'

export default function Polls({ isStaff }) {
  const [polls, setPolls] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('active') // 'active' | 'ended' | 'all'
  const [search, setSearch] = useState('')
  const [copiedId, setCopiedId] = useState(null)
  const [modalImage, setModalImage] = useState(null)

  async function load() {
    setLoading(true)
    try {
      const data = await fetchAllPolls()
      setPolls(data || [])
    } catch (err) {
      console.error('Failed to load polls', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  async function handleToggleStatus(poll, e) {
    e.preventDefault()
    e.stopPropagation()
    const nextStatus = poll.status === 'active' ? 'ended' : 'active'
    const confirmMsg = nextStatus === 'ended' 
      ? 'End this poll now? Students will no longer be able to cast votes.'
      : 'Start/Re-open this poll for voting?'
    
    if (!window.confirm(confirmMsg)) return

    try {
      await updatePollStatus(poll.id, nextStatus)
      setPolls((prev) =>
        prev.map((p) => (p.id === poll.id ? { ...p, status: nextStatus } : p))
      )
    } catch (err) {
      alert('Error updating poll status: ' + err.message)
    }
  }

  async function handleDelete(pollId, e) {
    e.preventDefault()
    e.stopPropagation()
    if (!window.confirm('Are you sure you want to delete this poll? This cannot be undone.')) return

    try {
      await deletePoll(pollId)
      setPolls((prev) => prev.filter((p) => p.id !== pollId))
    } catch (err) {
      alert('Error deleting poll: ' + err.message)
    }
  }

  function handleCopyLink(pollId, e) {
    e.preventDefault()
    e.stopPropagation()
    const baseUrl = window.location.href.split('/polls')[0]
    const url = `${baseUrl}/polls/${pollId}`
    navigator.clipboard.writeText(url).then(() => {
      setCopiedId(pollId)
      setTimeout(() => setCopiedId(null), 2200)
    }).catch(() => {
      // Fallback if clipboard API is blocked
      prompt('Copy this poll link:', url)
    })
  }

  function handleWhatsAppShare(poll, e) {
    e.preventDefault()
    e.stopPropagation()
    const baseUrl = window.location.href.split('/polls')[0]
    const url = `${baseUrl}/polls/${poll.id}`
    const text = encodeURIComponent(`Aravali Hostel Poll: ${poll.title}\n👉 ${url}`)
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank')
  }

  const activeCount = polls.filter((p) => p.status === 'active').length
  const endedCount = polls.filter((p) => p.status === 'ended').length

  const q = search.trim().toLowerCase()
  const filtered = polls.filter((p) => {
    const matchesFilter =
      filter === 'all' ||
      (filter === 'active' && p.status === 'active') ||
      (filter === 'ended' && p.status === 'ended')
    const matchesSearch =
      !q ||
      p.title?.toLowerCase().includes(q) ||
      p.description?.toLowerCase().includes(q)
    return matchesFilter && matchesSearch
  })

  return (
    <div className="polls-page">
      <div className="ongoing-head">
        <div>
          <p className="eyebrow">Community Decisions</p>
          <h1 className="page-title">Hostel Polls</h1>
          <p className="hero-sub small">
            Vote on hostel improvements, amenities, and view past voting results.
          </p>
        </div>

        <div className="polls-head-actions">
          {isStaff && (
            <Link to="/polls/new" className="btn-primary new-poll-btn">
              + Create New Poll
            </Link>
          )}
        </div>
      </div>

      <div className="toolbar">
        <div className="filter-pills">
          <button
            className={`pill ${filter === 'active' ? 'active' : ''}`}
            onClick={() => setFilter('active')}
          >
            Active Polls ({activeCount})
          </button>
          <button
            className={`pill ${filter === 'ended' ? 'active' : ''}`}
            onClick={() => setFilter('ended')}
          >
            Previous Results ({endedCount})
          </button>
          <button
            className={`pill ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            All ({polls.length})
          </button>
        </div>

        <div className="search">
          <span className="search-icon">⌕</span>
          <input
            placeholder="Search polls…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <p className="hint">Loading polls…</p>
      ) : filtered.length === 0 ? (
        <div className="empty">
          <p>No {filter === 'all' ? '' : filter} polls found.</p>
          <span>
            {filter === 'active'
              ? 'There are currently no open polls. Check back soon or view past results!'
              : 'Past concluded polls will appear here once ended.'}
          </span>
          {isStaff && (
            <div style={{ marginTop: 16 }}>
              <Link to="/polls/new" className="btn-primary">
                Create First Poll
              </Link>
            </div>
          )}
        </div>
      ) : (
        <div className="poll-grid">
          {filtered.map((poll) => {
            const isActive = poll.status === 'active'
            const total = poll.totalVotes || 0

            return (
              <article key={poll.id} className="poll-card">
                <div className="poll-card-top">
                  <div className="poll-badge-row">
                    <span className={`status-pill ${isActive ? 'active' : 'ended'}`}>
                      <span className="status-dot" />
                      {isActive ? 'Voting Open' : 'Concluded'}
                    </span>
                    <span className="votes-count-badge">
                      {total} {total === 1 ? 'vote' : 'votes'}
                    </span>
                  </div>

                  <Link to={`/polls/${poll.id}`} className="poll-title-link">
                    <h2 className="poll-card-title">{poll.title}</h2>
                  </Link>

                  {poll.description && (
                    <p className="poll-card-desc">{poll.description}</p>
                  )}
                </div>

                {/* Option image previews */}
                {poll.options && poll.options.length > 0 && (
                  <div className="poll-options-preview">
                    {poll.options.map((opt, i) => (
                      <div key={opt.id || i} className="poll-preview-item">
                        {opt.image_url ? (
                          <div
                            className="poll-preview-thumb-wrap"
                            onClick={(e) => {
                              e.stopPropagation()
                              setModalImage({
                                src: opt.image_url,
                                title: opt.text || `Option ${i + 1}`,
                              })
                            }}
                            title="Click to enlarge image"
                          >
                            <img
                              src={opt.image_url}
                              alt={opt.text}
                              className="poll-preview-thumb"
                              loading="lazy"
                            />
                            <span className="thumb-zoom-badge">🔍</span>
                          </div>
                        ) : (
                          <div className="poll-preview-nophoto">No photo</div>
                        )}
                        <span className="poll-preview-label">{opt.text}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Card footer with actions */}
                <div className="poll-card-footer">
                  <div className="poll-footer-left">
                    <Link to={`/polls/${poll.id}`} className="btn-view-poll">
                      {isActive ? 'Vote / View →' : 'View Final Results →'}
                    </Link>
                    <button
                      className="btn-share-link"
                      onClick={(e) => handleCopyLink(poll.id, e)}
                      title="Copy link to send on WhatsApp or email"
                    >
                      {copiedId === poll.id ? '✓ Copied' : '🔗 Link'}
                    </button>
                    <button
                      className="btn-share-link whatsapp"
                      onClick={(e) => handleWhatsAppShare(poll, e)}
                      title="Share directly to WhatsApp"
                    >
                      💬
                    </button>
                  </div>

                  {isStaff && (
                    <div className="poll-staff-actions">
                      <button
                        className={`btn-staff-toggle ${isActive ? 'end' : 'start'}`}
                        onClick={(e) => handleToggleStatus(poll, e)}
                      >
                        {isActive ? 'End Poll' : 'Start Poll'}
                      </button>
                      <button
                        className="delete-btn"
                        onClick={(e) => handleDelete(poll.id, e)}
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              </article>
            )
          })}
        </div>
      )}

      {/* Lightbox for expandable images */}
      <ImageModal
        src={modalImage?.src}
        alt={modalImage?.title}
        caption={modalImage?.title}
        onClose={() => setModalImage(null)}
      />
    </div>
  )
}

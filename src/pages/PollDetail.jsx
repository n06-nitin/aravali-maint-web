import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import {
  fetchPollById,
  castVote,
  updatePollStatus,
  deletePoll,
  getLocalUserVote,
  getSavedEntryNo,
} from '../services/pollsService'
import ImageModal from '../components/ImageModal'

export default function PollDetail({ isStaff }) {
  const { id } = useParams()
  const navigate = useNavigate()

  const [poll, setPoll] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedOption, setSelectedOption] = useState('')
  const [entryNo, setEntryNo] = useState(getSavedEntryNo())
  const [userVote, setUserVote] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [showResultsMode, setShowResultsMode] = useState(false)
  const [copied, setCopied] = useState(false)
  const [modalImage, setModalImage] = useState(null)

  async function load() {
    setLoading(true)
    setError('')
    try {
      const data = await fetchPollById(id)
      setPoll(data)
      const existing = getLocalUserVote(id)
      if (existing) {
        setUserVote(existing)
        setShowResultsMode(true)
      }
    } catch (err) {
      console.error(err)
      setError(err.message || 'Failed to load poll.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [id])

  async function handleVoteSubmit(e) {
    e.preventDefault()
    setError('')

    if (!selectedOption) {
      setError('Please select an option to cast your vote.')
      return
    }
    if (!entryNo.trim()) {
      setError('Please enter your IITD Entry Number.')
      return
    }

    setSubmitting(true)
    try {
      await castVote(poll.id, selectedOption, entryNo)
      const updated = await fetchPollById(poll.id)
      setPoll(updated)
      setUserVote({ optionId: selectedOption, entryNo: entryNo.trim().toUpperCase() })
      setShowResultsMode(true)
    } catch (err) {
      setError(err.message || 'Could not submit vote. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleToggleStatus() {
    const nextStatus = poll.status === 'active' ? 'ended' : 'active'
    const confirmMsg =
      nextStatus === 'ended'
        ? 'End this poll now? Voting will be closed and final results locked.'
        : 'Re-open this poll for active voting?'

    if (!window.confirm(confirmMsg)) return

    try {
      await updatePollStatus(poll.id, nextStatus)
      setPoll((prev) => ({ ...prev, status: nextStatus }))
    } catch (err) {
      alert('Error updating poll: ' + err.message)
    }
  }

  async function handleDelete() {
    if (!window.confirm('Delete this poll permanently? This cannot be undone.')) return
    try {
      await deletePoll(poll.id)
      navigate('/polls')
    } catch (err) {
      alert('Error deleting poll: ' + err.message)
    }
  }

  function handleShare() {
    const url = window.location.href
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2200)
    }).catch(() => {
      prompt('Copy this poll link:', url)
    })
  }

  function handleWhatsAppShare() {
    const url = window.location.href
    const text = encodeURIComponent(`Aravali Hostel Poll: ${poll?.title || 'Cast your vote'}\n👉 ${url}`)
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank')
  }

  if (loading) {
    return (
      <div className="poll-detail-wrap">
        <p className="hint">Loading poll…</p>
      </div>
    )
  }

  if (error && !poll) {
    return (
      <div className="poll-detail-wrap">
        <div className="empty">
          <p>Poll not found</p>
          <span>{error}</span>
          <div style={{ marginTop: 16 }}>
            <Link to="/polls" className="btn-primary">
              ← Back to Polls
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const isActive = poll.status === 'active'
  const isConcluded = poll.status === 'ended'
  const totalVotes = poll.totalVotes || 0
  const showResults = isConcluded || userVote || showResultsMode

  // Calculate highest vote count for winner badge in ended polls
  let maxVotes = 0
  if (poll.options) {
    for (const opt of poll.options) {
      const c = poll.voteCounts?.[opt.id] || 0
      if (c > maxVotes) maxVotes = c
    }
  }

  return (
    <div className="poll-detail-wrap">
      <div className="poll-detail-nav">
        <Link to="/polls" className="back-link">
          ← Back to all polls
        </Link>

        <div className="poll-detail-nav-right">
          <button className="btn-share-link" onClick={handleShare}>
            {copied ? '✓ Link Copied!' : '🔗 Copy Link'}
          </button>
          <button className="btn-share-link whatsapp" onClick={handleWhatsAppShare} title="Share poll on WhatsApp">
            💬 WhatsApp
          </button>

          {isStaff && (
            <div className="staff-actions-inline">
              <button
                className={`btn-staff-toggle ${isActive ? 'end' : 'start'}`}
                onClick={handleToggleStatus}
              >
                {isActive ? 'End Poll' : 'Start / Re-open Poll'}
              </button>
              <button className="delete-btn" onClick={handleDelete}>
                Delete
              </button>
            </div>
          )}
        </div>
      </div>

      <header className="poll-detail-header">
        <div className="poll-badge-row">
          <span className={`status-pill ${isActive ? 'active' : 'ended'}`}>
            <span className="status-dot" />
            {isActive ? 'Voting Open' : 'Poll Concluded'}
          </span>
          <span className="votes-count-badge">
            {totalVotes} {totalVotes === 1 ? 'vote' : 'votes'} total
          </span>
        </div>

        <h1 className="page-title" style={{ marginTop: 12 }}>
          {poll.title}
        </h1>

        {poll.description && (
          <p className="hero-sub" style={{ maxWidth: '65ch', marginTop: 8 }}>
            {poll.description}
          </p>
        )}
      </header>

      {/* VOTING FORM VIEW */}
      {isActive && !showResults && (
        <form onSubmit={handleVoteSubmit} className="poll-voting-form">
          <div className="poll-options-grid">
            {poll.options?.map((opt, index) => {
              const isSelected = selectedOption === opt.id

              return (
                <div
                  key={opt.id || index}
                  className={`poll-option-card ${isSelected ? 'selected' : ''}`}
                  onClick={() => setSelectedOption(opt.id)}
                >
                  {opt.image_url ? (
                    <div className="poll-option-image-wrap">
                      <img
                        src={opt.image_url}
                        alt={opt.text}
                        className="poll-option-image"
                        loading="lazy"
                      />
                      <button
                        type="button"
                        className="btn-expand-image"
                        onClick={(e) => {
                          e.stopPropagation()
                          setModalImage({
                            src: opt.image_url,
                            title: opt.text,
                          })
                        }}
                        title="Click to inspect sofa/furniture in full screen"
                      >
                        🔍 Expand Image
                      </button>
                    </div>
                  ) : (
                    <div className="poll-option-nophoto">No photo attached</div>
                  )}

                  <div className="poll-option-body">
                    <label className="poll-radio-label">
                      <input
                        type="radio"
                        name="poll-option"
                        value={opt.id}
                        checked={isSelected}
                        onChange={() => setSelectedOption(opt.id)}
                      />
                      <span className="option-title-text">{opt.text}</span>
                    </label>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="poll-cast-footer">
            <div className="entry-no-input-wrap">
              <label>
                Your IITD Entry Number *
                <input
                  type="text"
                  placeholder="e.g. 2024ME20525"
                  value={entryNo}
                  onChange={(e) => setEntryNo(e.target.value)}
                  required
                />
              </label>
              <span className="hint-small">1 vote per student</span>
            </div>

            {error && <p className="error">{error}</p>}

            <div className="poll-action-buttons">
              <button
                type="submit"
                className="btn-primary"
                disabled={submitting || !selectedOption || !entryNo.trim()}
              >
                {submitting ? 'Submitting Vote…' : 'Cast Vote →'}
              </button>

              <button
                type="button"
                className="btn-ghost"
                onClick={() => setShowResultsMode(true)}
              >
                View Live Results
              </button>
            </div>
          </div>
        </form>
      )}

      {/* RESULTS VIEW */}
      {showResults && (
        <div className="poll-results-container">
          <div className="poll-results-meta">
            <h2>{isConcluded ? 'Final Results' : 'Current Live Results'}</h2>
            {userVote && (
              <span className="user-voted-notice">
                ✓ You voted with entry {userVote.entryNo}
              </span>
            )}
          </div>

          <div className="poll-results-grid">
            {poll.options?.map((opt, index) => {
              const votesForOption = poll.voteCounts?.[opt.id] || 0
              const percentage =
                totalVotes > 0 ? Math.round((votesForOption / totalVotes) * 100) : 0
              const isWinner = isConcluded && totalVotes > 0 && votesForOption === maxVotes
              const isUserChoice = userVote?.optionId === opt.id

              return (
                <div
                  key={opt.id || index}
                  className={`poll-result-card ${isWinner ? 'winner-card' : ''} ${
                    isUserChoice ? 'user-choice-card' : ''
                  }`}
                >
                  {opt.image_url && (
                    <div
                      className="result-thumb-wrap"
                      onClick={() =>
                        setModalImage({
                          src: opt.image_url,
                          title: opt.text,
                        })
                      }
                      title="Click to enlarge"
                    >
                      <img src={opt.image_url} alt={opt.text} className="result-thumb" />
                      <span className="thumb-zoom-badge">🔍 Expand</span>
                    </div>
                  )}

                  <div className="result-body">
                    <div className="result-header-row">
                      <div className="result-title-group">
                        <span className="result-title">{opt.text}</span>
                        {isWinner && <span className="winner-badge">🏆 Winner</span>}
                        {isUserChoice && <span className="your-vote-badge">Your Vote</span>}
                      </div>

                      <div className="result-numbers">
                        <span className="result-percent">{percentage}%</span>
                        <span className="result-votes-count">
                          {votesForOption} {votesForOption === 1 ? 'vote' : 'votes'}
                        </span>
                      </div>
                    </div>

                    <div className="result-progress-track">
                      <div
                        className={`result-progress-fill ${isWinner ? 'winner-fill' : ''}`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {isActive && !userVote && (
            <div className="results-back-to-vote">
              <button
                type="button"
                className="btn-ghost"
                onClick={() => setShowResultsMode(false)}
              >
                ← Back to Voting Form
              </button>
            </div>
          )}
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

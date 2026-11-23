import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { createPoll } from '../services/pollsService'
import ImageModal from '../components/ImageModal'

export default function NewPoll({ isStaff }) {
  const navigate = useNavigate()

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [startImmediately, setStartImmediately] = useState(true)
  const [requireEntryNo, setRequireEntryNo] = useState(false)
  const [options, setOptions] = useState([
    { id: 'opt-1', text: '', file: null, previewUrl: '', imageUrl: '' },
    { id: 'opt-2', text: '', file: null, previewUrl: '', imageUrl: '' },
  ])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [modalImage, setModalImage] = useState(null)

  if (!isStaff) {
    return (
      <div className="form-wrap narrow">
        <p className="eyebrow">Restricted</p>
        <h1 className="page-title">Staff Only</h1>
        <p className="hero-sub small">
          Only Aravali maintenance staff, warden, and caretakers can create hostel polls.
        </p>
        <div style={{ marginTop: 24 }}>
          <Link to="/login" className="btn-primary">
            Sign In as Staff
          </Link>
        </div>
      </div>
    )
  }

  function handleOptionTextChange(index, value) {
    setOptions((prev) => {
      const copy = [...prev]
      copy[index].text = value
      return copy
    })
  }

  function handleImageFileChange(index, file) {
    if (!file) return
    const previewUrl = URL.createObjectURL(file)
    setOptions((prev) => {
      const copy = [...prev]
      copy[index].file = file
      copy[index].previewUrl = previewUrl
      copy[index].imageUrl = ''
      return copy
    })
  }

  function handleImageUrlChange(index, url) {
    setOptions((prev) => {
      const copy = [...prev]
      copy[index].imageUrl = url
      copy[index].previewUrl = url
      copy[index].file = null
      return copy
    })
  }

  function handleRemoveImage(index) {
    setOptions((prev) => {
      const copy = [...prev]
      copy[index].file = null
      copy[index].previewUrl = ''
      copy[index].imageUrl = ''
      return copy
    })
  }

  function handleAddOption() {
    setOptions((prev) => [
      ...prev,
      {
        id: 'opt-' + (prev.length + 1) + '-' + Math.random().toString(36).slice(2, 6),
        text: '',
        file: null,
        previewUrl: '',
        imageUrl: '',
      },
    ])
  }

  function handleRemoveOption(index) {
    if (options.length <= 2) {
      alert('A poll must have at least 2 options.')
      return
    }
    setOptions((prev) => prev.filter((_, i) => i !== index))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (!title.trim()) {
      setError('Please provide a poll title/question.')
      return
    }

    const filledOptions = options.filter((o) => o.text.trim().length > 0)
    if (filledOptions.length < 2) {
      setError('Please provide descriptions for at least 2 options.')
      return
    }

    setLoading(true)

    try {
      // Process and upload images
      const preparedOptions = []
      for (const opt of filledOptions) {
        let finalImageUrl = opt.imageUrl?.trim() || null

        if (opt.file) {
          try {
            const ext = opt.file.name.split('.').pop()
            const filename = `poll-${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
            const path = `polls/${filename}`

            const { error: upErr } = await supabase.storage
              .from('problem-photos')
              .upload(path, opt.file)

            if (!upErr) {
              const { data } = supabase.storage.from('problem-photos').getPublicUrl(path)
              finalImageUrl = data.publicUrl
            } else {
              console.warn('Storage upload error, using local data URL:', upErr)
              // Fallback to base64/previewUrl
              finalImageUrl = opt.previewUrl
            }
          } catch (storageErr) {
            console.warn('Storage upload caught error:', storageErr)
            finalImageUrl = opt.previewUrl
          }
        }

        preparedOptions.push({
          id: opt.id,
          text: opt.text.trim(),
          image_url: finalImageUrl,
        })
      }

      const created = await createPoll({
        title,
        description,
        options: preparedOptions,
        startImmediately,
        require_entry_no: requireEntryNo,
      })

      navigate(`/polls/${created.id}`)
    } catch (err) {
      console.error(err)
      setError(err.message || 'Failed to create poll. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="form-wrap">
      <p className="eyebrow">Staff Action</p>
      <h1 className="page-title">Create a Hostel Poll</h1>
      <p className="hero-sub small">
        Ask hostel residents for their input on new furniture, facilities, or decisions.
      </p>

      <form className="form" onSubmit={handleSubmit}>
        <label>
          Poll Title / Question *
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Which sofa set should we purchase for the common room?"
            required
          />
        </label>

        <label>
          Description / Context (optional)
          <textarea
            rows="3"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g. Total budget is ₹40,000. Option A is fabric, Option B is leatherette."
          />
        </label>

        <div className="poll-creation-options-section">
          <div className="section-header-row">
            <div>
              <h2 className="section-title">Poll Options & Photos</h2>
              <span className="hint-small">
                Add photos so students can inspect and expand sofa designs or items.
              </span>
            </div>
            <button
              type="button"
              className="btn-ghost small"
              onClick={handleAddOption}
            >
              + Add Option
            </button>
          </div>

          <div className="new-poll-options-list">
            {options.map((opt, index) => (
              <div key={opt.id} className="new-poll-option-row">
                <div className="option-index-badge">0{index + 1}</div>

                <div className="option-fields">
                  <input
                    type="text"
                    value={opt.text}
                    onChange={(e) => handleOptionTextChange(index, e.target.value)}
                    placeholder={`Option ${index + 1} title (e.g. Blue Velvet 3-Seater)`}
                    required
                  />

                  {/* Image attachment area */}
                  <div className="option-image-picker-zone">
                    {opt.previewUrl ? (
                      <div className="picker-preview-box">
                        <div
                          className="picker-thumb-clickable"
                          onClick={() =>
                            setModalImage({
                              src: opt.previewUrl,
                              title: opt.text || `Option ${index + 1}`,
                            })
                          }
                          title="Click to expand"
                        >
                          <img
                            src={opt.previewUrl}
                            alt="preview"
                            className="picker-thumbnail"
                          />
                          <span className="thumb-zoom-badge">🔍 Expand</span>
                        </div>
                        <button
                          type="button"
                          className="btn-remove-photo"
                          onClick={() => handleRemoveImage(index)}
                        >
                          ✕ Remove Photo
                        </button>
                      </div>
                    ) : (
                      <div className="photo-picker-inputs">
                        <label className="file-pick-btn">
                          📷 Upload Photo
                          <input
                            type="file"
                            accept="image/*"
                            style={{ display: 'none' }}
                            onChange={(e) =>
                              handleImageFileChange(index, e.target.files?.[0])
                            }
                          />
                        </label>
                        <span className="or-divider">or</span>
                        <input
                          type="url"
                          placeholder="Paste image link"
                          className="url-image-input"
                          value={opt.imageUrl}
                          onChange={(e) => handleImageUrlChange(index, e.target.value)}
                        />
                      </div>
                    )}
                  </div>
                </div>

                {options.length > 2 && (
                  <button
                    type="button"
                    className="btn-delete-option"
                    onClick={() => handleRemoveOption(index)}
                    title="Remove this option"
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="form-toggle-row">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={startImmediately}
              onChange={(e) => setStartImmediately(e.target.checked)}
            />
            <span>Start Poll immediately upon creation (Voting open)</span>
          </label>
        </div>

        <div className="form-toggle-row">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={requireEntryNo}
              onChange={(e) => setRequireEntryNo(e.target.checked)}
            />
            <span>Require IITD Entry Number to vote</span>
          </label>
          <span className="hint-small" style={{ marginLeft: 27, marginTop: 4 }}>
            {requireEntryNo
              ? 'Enforces 1 vote per student entry number.'
              : 'Default (Off): Frictionless 1-click voting (no entry number required).'}
          </span>
        </div>

        {error && <p className="error">{error}</p>}

        <div className="form-actions-row">
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Creating Poll…' : 'Publish Poll →'}
          </button>
          <Link to="/polls" className="btn-ghost">
            Cancel
          </Link>
        </div>
      </form>

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

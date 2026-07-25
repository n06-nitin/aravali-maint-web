import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { CATEGORIES, PRIORITIES } from '../constants'

const EMPTY = {
  name: '', entry_no: '', phone: '',
  category: 'washing_machine', priority: 'normal',
  location: '', description: '',
}

export default function AddProblem() {
  const navigate = useNavigate()
  const [form, setForm] = useState(EMPTY)
  const [files, setFiles] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const update = (k) => (e) => setForm({ ...form, [k]: e.target.value })

  async function handleSubmit() {
    setError('')
    if (!form.name || !form.entry_no || !form.phone || !form.description) {
      setError('Name, entry no, phone and the problem description are required.')
      return
    }
    setLoading(true)
    try {
      const photo_urls = []
      for (const file of files) {
        const path = `${Date.now()}-${Math.random().toString(36).slice(2)}-${file.name}`
        const { error: upErr } = await supabase
          .storage.from('problem-photos').upload(path, file)
        if (upErr) throw upErr
        const { data } = supabase.storage.from('problem-photos').getPublicUrl(path)
        photo_urls.push(data.publicUrl)
      }

      const { error: insErr } = await supabase.from('problems').insert({
        ...form,
        phone: form.phone.trim(),
        photo_urls,
      })
      if (insErr) throw insErr

      navigate('/ongoing')
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="form-wrap">
      <p className="eyebrow">New request</p>
      <h1 className="page-title">Report a Problem</h1>

      <div className="form">
        <div className="row">
          <label>Name *
            <input value={form.name} onChange={update('name')} placeholder="Your full name" />
          </label>
          <label>Entry No *
            <input value={form.entry_no} onChange={update('entry_no')} placeholder="2024ME20525" />
          </label>
        </div>

        <div className="row">
          <label>Phone *
            <input value={form.phone} onChange={update('phone')} placeholder="10-digit number" />
          </label>
          <label>Problem Location
            <input value={form.location} onChange={update('location')} placeholder="e.g. D-Senior Washroom" />
          </label>
        </div>

        <div className="row">
          <label>Category
            <select value={form.category} onChange={update('category')}>
              {CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
            </select>
          </label>
          <label>Priority
            <select value={form.priority} onChange={update('priority')}>
              {PRIORITIES.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
            </select>
          </label>
        </div>

        <label>Describe the problem *
          <textarea rows="4" value={form.description} onChange={update('description')}
            placeholder="What is wrong, and where exactly?" />
        </label>

        <label className="file-label">Add photos (optional)
          <input type="file" accept="image/*" multiple
            onChange={(e) => setFiles([...e.target.files])} />
        </label>
        {files.length > 0 && <p className="hint">{files.length} photo(s) selected</p>}

        {error && <p className="error">{error}</p>}

        <button className="btn-primary" disabled={loading} onClick={handleSubmit}>
          {loading ? 'Submitting…' : 'Submit problem'}
        </button>
      </div>
    </div>
  )
}

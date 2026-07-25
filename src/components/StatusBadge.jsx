import { STATUSES } from '../constants'

export default function StatusBadge({ status }) {
  const s = STATUSES[status] || STATUSES.new
  return (
    <span className="badge" style={{ color: s.color, borderColor: s.color }}>
      <span className="dot" style={{ background: s.color }} />
      {s.label}
    </span>
  )
}

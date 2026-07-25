import { CATEGORIES } from '../constants'

export default function CategoryFilter({ value, onChange }) {
  const items = [{ id: 'all', label: 'All' }, ...CATEGORIES]
  return (
    <div className="filter-pills">
      {items.map((c) => (
        <button
          key={c.id}
          className={`pill ${value === c.id ? 'active' : ''}`}
          onClick={() => onChange(c.id)}
        >
          {c.label}
        </button>
      ))}
    </div>
  )
}

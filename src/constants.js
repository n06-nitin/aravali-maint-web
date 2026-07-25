export const CATEGORIES = [
  { id: 'washing_machine', label: 'Washing Machine' },
  { id: 'washrooms', label: 'Washrooms' },
  { id: 'rooms', label: 'Individual Rooms' },
  { id: 'general', label: 'General Hostel' },
  { id: 'others', label: 'Others' },
]

// Status keys match the DB. Order matters for the staff buttons.
export const STATUSES = {
  new:        { label: 'Not Yet Registered', color: '#f97066' }, // red
  registered: { label: 'Registered',         color: '#f5b544' }, // amber
  resolved:   { label: 'Resolved',           color: '#4fd18b' }, // green
}

export const PRIORITIES = [
  { id: 'normal', label: 'Normal' },
  { id: 'urgent', label: 'Urgent' },
]

export const categoryLabel = (id) =>
  CATEGORIES.find((c) => c.id === id)?.label || id

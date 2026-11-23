import { useEffect } from 'react'

export default function ImageModal({ src, alt, caption, onClose }) {
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape') onClose()
    }
    if (src) {
      document.body.style.overflow = 'hidden'
      window.addEventListener('keydown', handleKeyDown)
    }
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [src, onClose])

  if (!src) return null

  return (
    <div className="lightbox-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="lightbox-content" onClick={(e) => e.stopPropagation()}>
        <button className="lightbox-close" onClick={onClose} aria-label="Close image">
          ✕
        </button>
        <img src={src} alt={alt || 'Enlarged view'} className="lightbox-image" />
        {caption && <div className="lightbox-caption">{caption}</div>}
      </div>
    </div>
  )
}

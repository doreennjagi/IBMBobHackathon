import { useEffect, type ReactNode } from 'react'
import { createPortal } from 'react-dom'

export interface NeoModalProps {
  open: boolean
  title: string
  onClose: () => void
  children: ReactNode
  /** Optional footer row inside modal */
  footer?: ReactNode
}

export function NeoModal({ open, title, onClose, children, footer }: NeoModalProps) {
  useEffect(() => {
    if (!open) {
      return
    }
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [open])

  useEffect(() => {
    if (!open) {
      return
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open || typeof document === 'undefined') {
    return null
  }

  return createPortal(
    <div
      className="sl-modal-backdrop"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) {
          onClose()
        }
      }}
    >
      <div
        className="sl-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="neo-modal-title"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="sl-modal__head">
          <h2 id="neo-modal-title" className="sl-modal__title">
            {title}
          </h2>
          <button type="button" className="sl-modal__close" onClick={onClose} aria-label="Close dialog">
            ×
          </button>
        </div>
        {children}
        {footer}
      </div>
    </div>,
    document.body,
  )
}

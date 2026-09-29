import { useState } from 'react'

// Render-prop pattern: pass `trigger` a function that receives an `open`
// callback, and render your own button/icon that calls it.
export default function ConfirmDialog({ trigger, title, message, confirmLabel = 'Confirm', danger, onConfirm }) {
  const [isOpen, setIsOpen] = useState(false)

  const handleConfirm = () => {
    setIsOpen(false)
    onConfirm()
  }

  return (
    <>
      {trigger(() => setIsOpen(true))}
      {isOpen && (
        <div className="modal-backdrop" onClick={() => setIsOpen(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <h3>{title}</h3>
            <p style={{ color: 'var(--cocoa-700)', fontSize: '0.92rem' }}>{message}</p>
            <div className="modal-actions">
              <button className="btn btn-outline" onClick={() => setIsOpen(false)}>
                Cancel
              </button>
              <button className={`btn ${danger ? 'btn-danger' : 'btn-primary'}`} onClick={handleConfirm}>
                {confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
import { useState, type ReactNode } from 'react'

interface Pending {
  message: string
  confirmLabel: string
  danger: boolean
  onConfirm: () => void
}

/** In-app replacement for window.confirm(), which embedded/standalone web views may block. */
export function useConfirm(): [ReactNode, (message: string, onConfirm: () => void, opts?: { confirmLabel?: string; danger?: boolean }) => void] {
  const [pending, setPending] = useState<Pending | null>(null)

  const ask = (message: string, onConfirm: () => void, opts: { confirmLabel?: string; danger?: boolean } = {}) =>
    setPending({ message, onConfirm, confirmLabel: opts.confirmLabel ?? 'OK', danger: opts.danger ?? false })

  const dialog = pending && (
    <div className="modal-backdrop" onClick={() => setPending(null)}>
      <div className="modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        <p>{pending.message}</p>
        <div className="row modal-actions">
          <button className="btn secondary" onClick={() => setPending(null)}>Cancel</button>
          <button
            className={`btn ${pending.danger ? 'destructive' : ''}`}
            autoFocus
            onClick={() => {
              setPending(null)
              pending.onConfirm()
            }}
          >
            {pending.confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )

  return [dialog, ask]
}

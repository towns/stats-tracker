import { useState } from 'react'
import type { Id, Player, Segment } from '../model/types'
import { PLAYERS_ON_FLOOR } from '../model/playingTime'

interface Props {
  segment: Segment
  roster: Player[]
  initial: Id[]
  previous?: { segment: Segment; players: Id[] }
  onSave: (players: Id[]) => void
  onClose: () => void
}

export default function LineupModal({ segment, roster, initial, previous, onSave, onClose }: Props) {
  const [selected, setSelected] = useState<Set<Id>>(() => new Set(initial))
  const toggle = (id: Id) => {
    const next = new Set(selected)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setSelected(next)
  }
  const n = selected.size

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal lineup-modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        <p>Who played {segment.label}? <span className="muted">({segment.minutes} min)</span></p>
        <div className="lineup-grid">
          {roster.map((p) => (
            <button key={p.id} className={`lineup-chip ${selected.has(p.id) ? 'on' : ''}`} onClick={() => toggle(p.id)}>
              <span className="num">{p.number}</span> {p.name}
            </button>
          ))}
        </div>
        <div className={`lineup-count ${n === PLAYERS_ON_FLOOR ? 'ok' : n > PLAYERS_ON_FLOOR ? 'bad' : ''}`}>
          {n} of {PLAYERS_ON_FLOOR} selected
        </div>
        <div className="row modal-actions">
          {previous && (
            <button className="btn ghost" onClick={() => setSelected(new Set(previous.players))}>
              Same as {previous.segment.label}
            </button>
          )}
          <button className="btn ghost" onClick={() => setSelected(new Set())}>Clear</button>
          <span className="spacer" />
          <button className="btn secondary" onClick={onClose}>Cancel</button>
          <button className="btn" onClick={() => onSave(roster.filter((p) => selected.has(p.id)).map((p) => p.id))}>
            Save
          </button>
        </div>
      </div>
    </div>
  )
}

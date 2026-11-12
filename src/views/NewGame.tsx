import { useState } from 'react'
import type { Store } from '../store'
import { go } from '../nav'

const today = () => new Date().toLocaleDateString('en-CA')

export default function NewGame({ store, teamId }: { store: Store; teamId?: string }) {
  const team = store.state.teams.find((t) => t.id === teamId)
  const [opponent, setOpponent] = useState('')
  const [date, setDate] = useState(today)
  const [format, setFormat] = useState<'Q' | 'H'>('Q')
  const [periodMinutes, setPeriodMinutes] = useState('6')
  const [split, setSplit] = useState(true)
  const [present, setPresent] = useState<Set<string>>(() => new Set(team?.players.map((p) => p.id)))

  if (!team) return <div className="page"><a href="#/">‹ Home</a><p>Team not found.</p></div>

  const toggle = (id: string) => {
    const next = new Set(present)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setPresent(next)
  }

  const start = () => {
    const roster = team.players
      .filter((p) => present.has(p.id))
      .sort((a, b) => Number(a.number) - Number(b.number) || a.number.localeCompare(b.number))
    const game = store.createGame(team, {
      opponent: opponent.trim() || 'Opponent',
      date,
      periodCount: format === 'Q' ? 4 : 2,
      periodLabel: format,
      periodMinutes: Number(periodMinutes) || 6,
      splitFirstHalf: format === 'Q' && split,
      roster,
    })
    go(`/game/${game.id}`)
  }

  return (
    <div className="page narrow">
      <header className="page-header">
        <a href="#/" className="back">‹ Home</a>
        <h1>New game · {team.name}</h1>
      </header>
      <label className="field">
        Opponent
        <input autoFocus value={opponent} placeholder="e.g. Eagles" onChange={(e) => setOpponent(e.target.value)} />
      </label>
      <label className="field">
        Date
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
      </label>
      <div className="field">
        Format
        <div className="segmented">
          <button className={format === 'Q' ? 'on' : ''} onClick={() => setFormat('Q')}>4 quarters</button>
          <button className={format === 'H' ? 'on' : ''} onClick={() => setFormat('H')}>2 halves</button>
        </div>
      </div>
      <div className="row settings">
        <label className="field">
          {format === 'Q' ? 'Quarter' : 'Half'} length (min)
          <input className="num" inputMode="numeric" value={periodMinutes} onChange={(e) => setPeriodMinutes(e.target.value)} />
        </label>
        {format === 'Q' && (
          <label className="check">
            <input type="checkbox" checked={split} onChange={(e) => setSplit(e.target.checked)} />
            Split Q1 &amp; Q2 into two sub segments
          </label>
        )}
      </div>
      <div className="field">
        Who's playing today? <span className="muted">(tap to toggle)</span>
        <div className="chips">
          {team.players.map((p) => (
            <button key={p.id} className={`chip ${present.has(p.id) ? 'on' : ''}`} onClick={() => toggle(p.id)}>
              #{p.number} {p.name}
            </button>
          ))}
        </div>
      </div>
      <button className="btn big" onClick={start} disabled={present.size === 0}>Start game</button>
    </div>
  )
}

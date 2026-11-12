import { useState } from 'react'
import { newId, type Store } from '../store'
import type { Player, Team } from '../model/types'
import { go } from '../nav'
import { useConfirm } from '../useConfirm'

export default function TeamEditor({ store, teamId }: { store: Store; teamId?: string }) {
  const existing = store.state.teams.find((t) => t.id === teamId)
  const [team, setTeam] = useState<Team>(
    existing ?? { id: newId(), name: '', players: [] },
  )
  const [number, setNumber] = useState('')
  const [name, setName] = useState('')
  const [confirmDialog, askConfirm] = useConfirm()

  const addPlayer = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() && !number.trim()) return
    setTeam({ ...team, players: [...team.players, { id: newId(), name: name.trim(), number: number.trim() }] })
    setName('')
    setNumber('')
    document.getElementById('player-number')?.focus()
  }

  const updatePlayer = (id: string, patch: Partial<Player>) =>
    setTeam({ ...team, players: team.players.map((p) => (p.id === id ? { ...p, ...patch } : p)) })

  const save = () => {
    store.saveTeam({ ...team, name: team.name.trim() || 'My Team' })
    go('/')
  }

  return (
    <div className="page narrow">
      <header className="page-header">
        <a href="#/" className="back">‹ Home</a>
        <h1>{existing ? 'Edit team' : 'New team'}</h1>
      </header>

      <label className="field">
        Team name
        <input value={team.name} placeholder="e.g. Lady Hawks" onChange={(e) => setTeam({ ...team, name: e.target.value })} />
      </label>

      <h2>Roster</h2>
      <table className="roster">
        <thead>
          <tr><th>#</th><th>Name</th><th /></tr>
        </thead>
        <tbody>
          {team.players.map((p) => (
            <tr key={p.id}>
              <td><input className="num" value={p.number} onChange={(e) => updatePlayer(p.id, { number: e.target.value })} /></td>
              <td><input value={p.name} onChange={(e) => updatePlayer(p.id, { name: e.target.value })} /></td>
              <td>
                <button className="btn ghost" onClick={() => setTeam({ ...team, players: team.players.filter((x) => x.id !== p.id) })}>
                  Remove
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <form className="row add-player" onSubmit={addPlayer}>
        <input id="player-number" className="num" placeholder="#" inputMode="numeric" value={number} onChange={(e) => setNumber(e.target.value)} />
        <input placeholder="Player name" value={name} onChange={(e) => setName(e.target.value)} />
        <button className="btn secondary" type="submit">Add</button>
      </form>

      <div className="row actions">
        <button className="btn" onClick={save}>Save team</button>
        {existing && (
          <button
            className="btn ghost danger"
            onClick={() =>
              askConfirm(`Delete ${existing.name}? Past games are kept.`, () => {
                store.deleteTeam(existing.id)
                go('/')
              }, { confirmLabel: 'Delete', danger: true })
            }
          >
            Delete team
          </button>
        )}
      </div>
      {confirmDialog}
    </div>
  )
}

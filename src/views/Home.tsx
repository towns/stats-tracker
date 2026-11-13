import { useRef } from 'react'
import { demoTeam, parseBackup, type Store } from '../store'
import { score } from '../model/stats'
import { useConfirm } from '../useConfirm'

export default function Home({ store }: { store: Store }) {
  const { teams, games } = store.state
  const [confirmDialog, askConfirm] = useConfirm()
  const fileInput = useRef<HTMLInputElement>(null)

  const backup = () => {
    const blob = new Blob([JSON.stringify(store.state, null, 2)], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `stat-tracker-backup-${new Date().toLocaleDateString('en-CA')}.json`
    a.click()
    URL.revokeObjectURL(a.href)
  }

  const restore = async (file: File) => {
    try {
      const data = parseBackup(await file.text())
      askConfirm(
        `Replace all data on this device with the backup (${data.teams.length} teams, ${data.games.length} games)?`,
        () => store.replaceState(data),
        { confirmLabel: 'Restore', danger: true },
      )
    } catch (e) {
      askConfirm(`Couldn't read that file: ${(e as Error).message}`, () => {}, { confirmLabel: 'OK' })
    }
  }
  return (
    <div className="page">
      <header className="page-header">
        <h1>🏀 Stat Tracker</h1>
      </header>

      <section>
        <div className="section-head">
          <h2>Teams</h2>
          <a className="btn" href="#/team/new">+ New team</a>
        </div>
        {teams.length === 0 && (
          <div className="empty">
            <p>No teams yet. Create your team and roster to get started.</p>
            <button className="btn secondary" onClick={() => store.saveTeam(demoTeam())}>
              Load a demo team
            </button>
          </div>
        )}
        <ul className="cards">
          {teams.map((t) => (
            <li key={t.id} className="card">
              <div>
                <strong>{t.name}</strong>
                <div className="muted">
                  {t.players.length} players · {games.filter((g) => g.teamId === t.id).length} games
                </div>
              </div>
              <div className="row">
                <a className="btn secondary" href={`#/team/${t.id}`}>Roster</a>
                <a className="btn secondary" href={`#/season/${t.id}`}>Season</a>
                <a className="btn" href={`#/new-game/${t.id}`}>Start game</a>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2>Games</h2>
        {games.length === 0 && <p className="muted">No games yet.</p>}
        <ul className="cards">
          {games.map((g) => (
            <li key={g.id} className="card">
              <div>
                <strong>{g.teamName} vs {g.opponent}</strong>
                <div className="muted">
                  {g.date} · {g.status === 'live' ? <span className="live">LIVE</span> : 'Final'} ·{' '}
                  {score(g, 'us')}–{score(g, 'them')}
                </div>
              </div>
              <div className="row">
                <a className="btn secondary" href={`#/game/${g.id}/box`}>Box score</a>
                <a className="btn" href={`#/game/${g.id}`}>{g.status === 'live' ? 'Resume' : 'Open'}</a>
                <button
                  className="btn ghost"
                  onClick={() => askConfirm(`Delete game vs ${g.opponent}? This can't be undone.`, () => store.deleteGame(g.id), { confirmLabel: 'Delete', danger: true })}
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      </section>
      <section className="data-section">
        <h2>Your data</h2>
        <p className="muted">
          Stats are saved only on this device. Back up regularly, or to move data to another device.
        </p>
        <div className="row">
          <button className="btn secondary" onClick={backup}>Download backup</button>
          <button className="btn secondary" onClick={() => fileInput.current?.click()}>Restore from backup</button>
          <input
            ref={fileInput}
            type="file"
            accept="application/json,.json"
            hidden
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) restore(f)
              e.target.value = ''
            }}
          />
        </div>
      </section>
      {confirmDialog}
    </div>
  )
}

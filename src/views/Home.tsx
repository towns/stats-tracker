import { demoTeam, type Store } from '../store'
import { score } from '../model/stats'

export default function Home({ store }: { store: Store }) {
  const { teams, games } = store.state
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
                  onClick={() => confirm(`Delete game vs ${g.opponent}?`) && store.deleteGame(g.id)}
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}

import type { Store } from '../store'
import type { Game } from '../model/types'
import { BOX_COLUMNS, boxScore, boxScoreCsv, periodName, score, type StatLine } from '../model/stats'

export default function BoxScoreView({ game }: { store: Store; game: Game }) {
  const box = boxScore(game)
  const n = box.periodScores.us.length

  const download = () => {
    const blob = new Blob([boxScoreCsv(game)], { type: 'text/csv' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `${game.date}-${game.teamName}-vs-${game.opponent}.csv`.replace(/\s+/g, '_')
    a.click()
    URL.revokeObjectURL(a.href)
  }

  const cells = (l: StatLine) => BOX_COLUMNS.map(([h, f]) => <td key={h}>{f(l)}</td>)

  return (
    <div className="page">
      <header className="page-header">
        <a href="#/" className="back">‹ Home</a>
        <h1>{game.teamName} {score(game, 'us')} – {score(game, 'them')} {game.opponent}</h1>
        <div className="muted">{game.date} · {game.status === 'live' ? <span className="live">LIVE</span> : 'Final'}</div>
        <div className="row">
          <a className="btn" href={`#/game/${game.id}`}>{game.status === 'live' ? '‹ Back to game' : 'Edit stats'}</a>
          <button className="btn secondary" onClick={download}>Export CSV</button>
          <button className="btn secondary" onClick={() => window.print()}>Print</button>
        </div>
      </header>

      <div className="table-wrap">
        <table className="periods">
          <thead>
            <tr>
              <th />
              {Array.from({ length: n }, (_, i) => <th key={i}>{periodName(game, i + 1)}</th>)}
              <th>T</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="name">{game.teamName}</td>
              {box.periodScores.us.map((s, i) => <td key={i}>{s}</td>)}
              <td><b>{box.team.pts}</b></td>
            </tr>
            <tr>
              <td className="name">{game.opponent}</td>
              {box.periodScores.them.map((s, i) => <td key={i}>{s}</td>)}
              <td><b>{box.opponent.pts}</b></td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="table-wrap">
        <table className="box">
          <thead>
            <tr>
              <th>#</th>
              <th className="name">Player</th>
              {BOX_COLUMNS.map(([h]) => <th key={h}>{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {game.roster.map((p) => (
              <tr key={p.id}>
                <td>{p.number}</td>
                <td className="name">{p.name}</td>
                {cells(box.players[p.id])}
              </tr>
            ))}
            <tr className="sub">
              <td />
              <td className="name">Team</td>
              {cells(box.teamOnly)}
            </tr>
          </tbody>
          <tfoot>
            <tr>
              <td />
              <td className="name">Total</td>
              {cells(box.team)}
            </tr>
            <tr className="opp-row">
              <td />
              <td className="name">{game.opponent}</td>
              {cells(box.opponent)}
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  )
}

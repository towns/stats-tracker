import { useState } from 'react'
import type { Store } from '../store'
import { BOX_COLUMNS, pct, type StatLine } from '../model/stats'
import { formatMinutes } from '../model/playingTime'
import { formatStat, perGame, record, seasonCsv, seasonSummary, type PlayerSeason } from '../model/season'

type Mode = 'avg' | 'totals'

const LEADERS: { label: string; stat: keyof StatLine }[] = [
  { label: 'Points', stat: 'pts' },
  { label: 'Rebounds', stat: 'reb' },
  { label: 'Assists', stat: 'ast' },
  { label: 'Steals', stat: 'stl' },
]

export default function SeasonView({ store, teamId }: { store: Store; teamId?: string }) {
  const [mode, setMode] = useState<Mode>('avg')
  const team = store.state.teams.find((t) => t.id === teamId)
  if (!team) return <div className="page"><a href="#/">‹ Home</a><p>Team not found.</p></div>

  const games = store.state.games.filter((g) => g.teamId === team.id)
  const s = seasonSummary(games, team)
  const dec = mode === 'avg' ? 1 : 0
  const view = (l: StatLine, gp: number) => (mode === 'avg' ? perGame(l, gp) : l)
  const cells = (l: StatLine, gp: number, opp = false) =>
    BOX_COLUMNS.map(([h, f]) => (
      <td key={h}>{opp && h.endsWith('%') ? '–' : formatStat(f(view(l, gp)), dec)}</td>
    ))

  const leader = (stat: keyof StatLine): PlayerSeason | undefined =>
    s.players
      .filter((p) => p.gp > 0)
      .reduce<PlayerSeason | undefined>(
        (best, p) => (!best || p.totals[stat] / p.gp > best.totals[stat] / best.gp ? p : best),
        undefined,
      )

  const download = () => {
    const blob = new Blob([seasonCsv(s, mode)], { type: 'text/csv' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `${team.name}-season-${mode}.csv`.replace(/\s+/g, '_')
    a.click()
    URL.revokeObjectURL(a.href)
  }

  return (
    <div className="page">
      <header className="page-header">
        <a href="#/" className="back">‹ Home</a>
        <h1>{team.name} · Season</h1>
        <div className="muted">
          {s.gp} game{s.gp === 1 ? '' : 's'} · Record <b>{record(s)}</b>
          {s.gp > 0 && <> · {(s.team.pts / s.gp).toFixed(1)} PPG · {(s.opponent.pts / s.gp).toFixed(1)} opp PPG</>}
        </div>
        <div className="row">
          <a className="btn" href={`#/new-game/${team.id}`}>Start game</a>
          <button className="btn secondary" onClick={download} disabled={s.gp === 0}>Export CSV</button>
          <button className="btn secondary" onClick={() => window.print()}>Print</button>
        </div>
      </header>

      {s.gp === 0 ? (
        <p className="muted">No games yet for this team.</p>
      ) : (
        <>
          <div className="leaders">
            {LEADERS.map(({ label, stat }) => {
              const p = leader(stat)
              return (
                <div key={stat} className="leader">
                  <div className="muted">{label} / game</div>
                  <div className="leader-val">{p ? (p.totals[stat] / p.gp).toFixed(1) : '–'}</div>
                  <div>{p ? `#${p.player.number} ${p.player.name}` : ''}</div>
                </div>
              )
            })}
            <div className="leader">
              <div className="muted">Team shooting</div>
              <div className="leader-val">{pct(s.team.fgm, s.team.fga)}</div>
              <div>3PT {pct(s.team.fg3m, s.team.fg3a)} · FT {pct(s.team.ftm, s.team.fta)}</div>
            </div>
          </div>

          <div className="section-head">
            <h2>Player stats</h2>
            <div className="segmented">
              <button className={mode === 'avg' ? 'on' : ''} onClick={() => setMode('avg')}>Per game</button>
              <button className={mode === 'totals' ? 'on' : ''} onClick={() => setMode('totals')}>Totals</button>
            </div>
          </div>
          <div className="table-wrap">
            <table className="box">
              <thead>
                <tr>
                  <th>#</th>
                  <th className="name">Player</th>
                  <th>GP</th>
                  <th>MIN</th>
                  <th title="Games below half-game playing time">Short</th>
                  {BOX_COLUMNS.map(([h]) => <th key={h}>{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {s.players.map((p) => (
                  <tr key={p.player.id}>
                    <td>{p.player.number}</td>
                    <td className="name">{p.player.name}</td>
                    <td>{p.gp}</td>
                    <td>{p.trackedGames ? formatMinutes(mode === 'avg' ? Number((p.minutes / p.trackedGames).toFixed(1)) : p.minutes) : '–'}</td>
                    <td className={p.shortGames ? 'short-count' : ''}>{p.trackedGames ? p.shortGames : '–'}</td>
                    {cells(p.totals, p.gp)}
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td />
                  <td className="name">Team</td>
                  <td>{s.gp}</td>
                  <td />
                  <td />
                  {cells(s.team, s.gp)}
                </tr>
                <tr className="opp-row">
                  <td />
                  <td className="name">Opponents</td>
                  <td>{s.gp}</td>
                  <td />
                  <td />
                  {cells(s.opponent, s.gp, true)}
                </tr>
              </tfoot>
            </table>
          </div>

          <h2>Game log</h2>
          <div className="table-wrap">
            <table className="box">
              <thead>
                <tr>
                  <th className="name">Date</th>
                  <th className="name">Opponent</th>
                  <th>Result</th>
                  <th>Score</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {s.results.map((r) => (
                  <tr key={r.game.id}>
                    <td className="name">{r.game.date}</td>
                    <td className="name">{r.game.opponent}</td>
                    <td className={`result ${r.result ?? 'live'}`}>{r.result ?? 'LIVE'}</td>
                    <td>{r.us}–{r.them}</td>
                    <td><a href={`#/game/${r.game.id}/box`}>Box score</a></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}

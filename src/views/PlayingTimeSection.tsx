import type { Game } from '../model/types'
import { PLAYERS_ON_FLOOR, formatMinutes, playingTime } from '../model/playingTime'

const STATUS_LABEL = { met: '✓ Met', 'on-track': 'On track', 'at-risk': 'At risk', short: 'Short' }

export default function PlayingTimeSection({ game }: { game: Game }) {
  const pt = playingTime(game)
  const lineups = game.lineups ?? {}
  const recordedAny = pt.segments.some((s) => lineups[s.id])
  const short = pt.players.filter((p) => p.status === 'short')
  const atRisk = pt.players.filter((p) => p.status === 'at-risk')

  return (
    <section>
      <h2>Playing time <span className="muted">· goal: at least {formatMinutes(pt.target)} of {formatMinutes(pt.totalMinutes)} min</span></h2>

      {!recordedAny ? (
        <div className="pt-alert warn">No lineups recorded for this game. Set who's on the floor from the live game screen.</div>
      ) : (
        <>
          {short.length > 0 ? (
            <div className="pt-alert bad">
              ⚠ {short.length} player{short.length === 1 ? '' : 's'} {pt.complete || game.status === 'final' ? 'did not reach' : "can't reach"} half the game:
              <ul>
                {short.map((p) => (
                  <li key={p.player.id}>
                    #{p.player.number} {p.player.name} — {formatMinutes(p.minutes)} min ({p.segments.map((s) => s.label).join(', ') || 'did not play'})
                  </li>
                ))}
              </ul>
            </div>
          ) : pt.complete ? (
            <div className="pt-alert good">✓ Every player played at least half the game.</div>
          ) : null}
          {atRisk.length > 0 && (
            <div className="pt-alert warn">
              At risk: {atRisk.map((p) => `#${p.player.number} ${p.player.name} (needs ${formatMinutes(p.target - p.minutes)} more min)`).join(', ')}
            </div>
          )}
          {(pt.missing.length > 0 || pt.irregular.length > 0) && (
            <div className="pt-alert warn">
              {pt.missing.length > 0 && <div>Lineup not recorded: {pt.missing.map((s) => s.label).join(', ')}</div>}
              {pt.irregular.map(({ segment, count }) => (
                <div key={segment.id}>{segment.label} has {count} players recorded (expected {PLAYERS_ON_FLOOR})</div>
              ))}
            </div>
          )}
        </>
      )}

      <div className="table-wrap">
        <table className="box pt">
          <thead>
            <tr>
              <th>#</th>
              <th className="name">Player</th>
              {pt.segments.map((s) => (
                <th key={s.id} className={lineups[s.id] ? '' : 'unset'}>
                  {s.label}
                  <div className="muted">{formatMinutes(s.minutes)}m</div>
                </th>
              ))}
              <th>MIN</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {pt.players.map((p) => (
              <tr key={p.player.id} className={p.status === 'short' ? 'short' : ''}>
                <td>{p.player.number}</td>
                <td className="name">{p.player.name}</td>
                {pt.segments.map((s) =>
                  lineups[s.id]?.includes(p.player.id)
                    ? <td key={s.id} className="dot">●</td>
                    : <td key={s.id} className="empty-seg">{lineups[s.id] ? '·' : ''}</td>,
                )}
                <td><b>{formatMinutes(p.minutes)}</b></td>
                <td className={`status ${p.status}`}>{STATUS_LABEL[p.status]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

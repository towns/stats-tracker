import { useEffect, useRef, useState } from 'react'
import type { Store } from '../store'
import type { Game, GameEvent, StatKind } from '../model/types'
import { KIND_LABEL, boxScore, periodName, playerFouls, score, teamFouls } from '../model/stats'
import { go } from '../nav'

type Target = string | 'team' | null

const SHOTS: { label: string; made: StatKind; miss: StatKind }[] = [
  { label: '2PT', made: 'fg2_made', miss: 'fg2_miss' },
  { label: '3PT', made: 'fg3_made', miss: 'fg3_miss' },
  { label: 'FT', made: 'ft_made', miss: 'ft_miss' },
]

const OTHER: { kind: StatKind; label: string; cls?: string }[] = [
  { kind: 'oreb', label: 'Off Reb' },
  { kind: 'dreb', label: 'Def Reb' },
  { kind: 'ast', label: 'Assist' },
  { kind: 'stl', label: 'Steal' },
  { kind: 'blk', label: 'Block' },
  { kind: 'tov', label: 'Turnover', cls: 'warn' },
  { kind: 'foul', label: 'Foul', cls: 'warn' },
]

const OPP: { kind: StatKind; label: string }[] = [
  { kind: 'fg2_made', label: '+2' },
  { kind: 'fg3_made', label: '+3' },
  { kind: 'ft_made', label: '+1 FT' },
  { kind: 'foul', label: 'Foul' },
]

export default function LiveGame({ store, game }: { store: Store; game: Game }) {
  const [target, setTarget] = useState<Target>(null)
  const [pending, setPending] = useState<StatKind | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const toastTimer = useRef<number | undefined>(undefined)
  const box = boxScore(game)
  const period = game.currentPeriod

  useEffect(() => () => window.clearTimeout(toastTimer.current), [])

  const flash = (msg: string) => {
    setToast(msg)
    window.clearTimeout(toastTimer.current)
    toastTimer.current = window.setTimeout(() => setToast(null), 2000)
  }

  const who = (playerId?: string, side: 'us' | 'them' = 'us') => {
    if (side === 'them') return game.opponent
    if (!playerId) return 'Team'
    const p = game.roster.find((x) => x.id === playerId)
    return p ? `#${p.number} ${p.name}` : 'Unknown'
  }

  const commit = (kind: StatKind, t: Exclude<Target, null>) => {
    const playerId = t === 'team' ? undefined : t
    store.record(game.id, 'us', kind, playerId)
    flash(`${who(playerId)} · ${KIND_LABEL[kind]}`)
    setTarget(null)
    setPending(null)
  }

  const tapPlayer = (t: Exclude<Target, null>) => {
    if (pending) return commit(pending, t)
    setTarget(target === t ? null : t)
  }

  const tapStat = (kind: StatKind) => {
    if (target) return commit(kind, target)
    setPending(pending === kind ? null : kind)
  }

  const tapOpp = (kind: StatKind) => {
    store.record(game.id, 'them', kind)
    flash(`${game.opponent} · ${KIND_LABEL[kind]}`)
  }

  const undo = () => {
    const last = game.events[game.events.length - 1]
    if (!last) return
    store.removeEvent(game.id, last.id)
    flash(`Undid: ${describe(last)}`)
  }

  const describe = (e: GameEvent) => `${who(e.playerId, e.side)} · ${KIND_LABEL[e.kind]}`

  const isOn = (kind: StatKind) => pending === kind
  const recent = [...game.events].reverse().slice(0, 12)
  const usFouls = teamFouls(game, 'us', period)
  const themFouls = teamFouls(game, 'them', period)

  return (
    <div className="live-game">
      <header className="scoreboard">
        <a href="#/" className="back">‹</a>
        <div className="team-score">
          <div className="team-name">{game.teamName}</div>
          <div className="pts">{score(game, 'us')}</div>
          <div className="fouls">Fouls {usFouls}</div>
        </div>
        <div className="period">
          <button onClick={() => store.setPeriod(game.id, period - 1)} disabled={period <= 1} aria-label="Previous period">◀</button>
          <span>{periodName(game, period)}</span>
          <button onClick={() => store.setPeriod(game.id, period + 1)} aria-label="Next period">▶</button>
        </div>
        <div className="team-score">
          <div className="team-name">{game.opponent}</div>
          <div className="pts">{score(game, 'them')}</div>
          <div className="fouls">Fouls {themFouls}</div>
        </div>
        <div className="header-actions">
          <a className="btn secondary" href={`#/game/${game.id}/box`}>Box score</a>
          {game.status === 'live' ? (
            <button className="btn" onClick={() => { if (confirm('End game?')) { store.setStatus(game.id, 'final'); go(`/game/${game.id}/box`) } }}>
              End game
            </button>
          ) : (
            <button className="btn secondary" onClick={() => store.setStatus(game.id, 'live')}>Reopen</button>
          )}
        </div>
      </header>

      {game.status === 'final' && <div className="banner">This game is final. Edits still allowed.</div>}

      <main className="live-body">
        <section className="players">
          <div className="hint">
            {pending
              ? <>Who? <strong>{KIND_LABEL[pending]}</strong></>
              : target
                ? <>Pick a stat for <strong>{who(target === 'team' ? undefined : target)}</strong></>
                : 'Tap a player, then a stat (or stat, then player)'}
          </div>
          <div className="player-grid">
            {game.roster.map((p) => {
              const line = box.players[p.id]
              const pf = playerFouls(game, p.id)
              return (
                <button
                  key={p.id}
                  className={`player ${target === p.id ? 'selected' : ''} ${pending ? 'awaiting' : ''} ${pf >= 5 ? 'out' : pf >= 4 ? 'danger' : ''}`}
                  onClick={() => tapPlayer(p.id)}
                >
                  <span className="num">{p.number}</span>
                  <span className="name">{p.name}</span>
                  <span className="mini">{line.pts} pts · {line.reb} reb · <b>{pf} PF</b></span>
                </button>
              )
            })}
            <button className={`player team ${target === 'team' ? 'selected' : ''} ${pending ? 'awaiting' : ''}`} onClick={() => tapPlayer('team')}>
              <span className="num">T</span>
              <span className="name">Team</span>
              <span className="mini">no player</span>
            </button>
          </div>
        </section>

        <section className="pad">
          <div className="shots">
            {SHOTS.map((s) => (
              <div key={s.label} className="shot">
                <div className="shot-label">{s.label}</div>
                <button className={`stat made ${isOn(s.made) ? 'on' : ''}`} onClick={() => tapStat(s.made)}>✓ Made</button>
                <button className={`stat miss ${isOn(s.miss) ? 'on' : ''}`} onClick={() => tapStat(s.miss)}>✗ Miss</button>
              </div>
            ))}
          </div>
          <div className="other">
            {OTHER.map((o) => (
              <button key={o.kind} className={`stat ${o.cls ?? ''} ${isOn(o.kind) ? 'on' : ''}`} onClick={() => tapStat(o.kind)}>
                {o.label}
              </button>
            ))}
            <button className="stat undo" onClick={undo} disabled={game.events.length === 0}>↶ Undo</button>
          </div>

          <div className="opp">
            <div className="opp-label">{game.opponent}</div>
            {OPP.map((o) => (
              <button key={o.kind} className="stat opp-btn" onClick={() => tapOpp(o.kind)}>{o.label}</button>
            ))}
          </div>
        </section>

        <aside className="log">
          <h3>Play log</h3>
          {recent.length === 0 && <p className="muted">Nothing yet.</p>}
          <ul>
            {recent.map((e) => (
              <li key={e.id} className={e.side}>
                <span className="per">{periodName(game, e.period)}</span>
                <span className="desc">{describe(e)}</span>
                <button className="x" aria-label="Delete" onClick={() => store.removeEvent(game.id, e.id)}>×</button>
              </li>
            ))}
          </ul>
        </aside>
      </main>

      {toast && <div className="toast">{toast}</div>}
    </div>
  )
}

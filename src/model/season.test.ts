import { describe, expect, it } from 'vitest'
import { perGame, record, seasonCsv, seasonSummary } from './season'
import type { Game, GameEvent, Player, StatKind } from './types'

let seq = 0
const ev = (kind: StatKind, opts: Partial<GameEvent> = {}): GameEvent => ({
  id: String(seq++), at: seq, period: 1, side: 'us', kind, ...opts,
})
const ava: Player = { id: 'a', name: 'Ava', number: '3' }
const bea: Player = { id: 'b', name: 'Bea', number: '12' }
const game = (id: string, date: string, roster: Player[], events: GameEvent[], status: Game['status'] = 'final'): Game => ({
  id, teamId: 't', teamName: 'Hawks', opponent: `Opp ${id}`, date,
  periodCount: 4, periodLabel: 'Q', currentPeriod: 4, status, roster, events,
})

describe('seasonSummary', () => {
  const games = [
    game('g2', '2026-11-10', [ava], [ev('fg2_made', { playerId: 'a' }), ev('fg3_made', { side: 'them' })]),
    game('g1', '2026-11-03', [ava, bea], [
      ev('fg3_made', { playerId: 'a' }), ev('fg2_made', { playerId: 'b' }), ev('dreb', { playerId: 'b' }),
      ev('fg2_made', { side: 'them' }),
    ]),
    game('g3', '2026-11-17', [ava, bea], [ev('ft_made', { playerId: 'b' })], 'live'),
  ]
  const team = { id: 't', name: 'Hawks', players: [{ ...ava, name: 'Ava R.' }, bea] }
  const s = seasonSummary(games, team)

  it('orders games by date and computes record (live games excluded)', () => {
    expect(s.results.map((r) => r.game.id)).toEqual(['g1', 'g2', 'g3'])
    expect(s.results.map((r) => r.result)).toEqual(['W', 'L', undefined])
    expect(record(s)).toBe('1-1')
  })

  it('aggregates player totals and games played', () => {
    const a = s.players.find((p) => p.player.id === 'a')!
    const b = s.players.find((p) => p.player.id === 'b')!
    expect(a).toMatchObject({ gp: 3, totals: { pts: 5, fgm: 2 } })
    expect(a.player.name).toBe('Ava R.')
    expect(b).toMatchObject({ gp: 2, totals: { pts: 3, reb: 1, ftm: 1 } })
    expect(perGame(b.totals, b.gp).pts).toBe(1.5)
  })

  it('aggregates team and opponent totals', () => {
    expect(s.team.pts).toBe(8)
    expect(s.opponent.pts).toBe(5)
  })

  it('exports per-game CSV', () => {
    const lines = seasonCsv(s, 'avg').trim().split('\n')
    expect(lines[0].startsWith('#,Player,GP,PTS')).toBe(true)
    expect(lines[2].startsWith('12,Bea,2,1.5')).toBe(true)
  })
})

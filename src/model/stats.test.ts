import { describe, expect, it } from 'vitest'
import { boxScore, boxScoreCsv, periodName, score, teamFouls } from './stats'
import type { Game, GameEvent, StatKind } from './types'

let seq = 0
const ev = (kind: StatKind, opts: Partial<GameEvent> = {}): GameEvent => ({
  id: String(seq++), at: seq, period: 1, side: 'us', kind, ...opts,
})

const game = (events: GameEvent[]): Game => ({
  id: 'g', teamId: 't', teamName: 'Hawks', opponent: 'Eagles', date: '2026-11-12',
  periodCount: 4, periodLabel: 'Q', currentPeriod: 1, status: 'live',
  roster: [{ id: 'a', name: 'Ava', number: '3' }, { id: 'b', name: 'Bea', number: '12' }],
  events,
})

describe('stats', () => {
  const g = game([
    ev('fg2_made', { playerId: 'a' }),
    ev('fg3_made', { playerId: 'a', period: 2 }),
    ev('fg3_miss', { playerId: 'b' }),
    ev('ft_made', { playerId: 'b' }),
    ev('ft_miss', { playerId: 'b' }),
    ev('dreb'),
    ev('foul', { playerId: 'a' }),
    ev('fg2_made', { side: 'them' }),
    ev('foul', { side: 'them', period: 2 }),
  ])

  it('computes scores overall and by period', () => {
    expect(score(g, 'us')).toBe(6)
    expect(score(g, 'them')).toBe(2)
    expect(boxScore(g).periodScores).toEqual({ us: [3, 3, 0, 0], them: [2, 0, 0, 0] })
  })

  it('computes player lines', () => {
    const box = boxScore(g)
    expect(box.players.a).toMatchObject({ pts: 5, fgm: 2, fga: 2, fg3m: 1, fg3a: 1, pf: 1 })
    expect(box.players.b).toMatchObject({ pts: 1, fgm: 0, fga: 1, fg3a: 1, ftm: 1, fta: 2 })
    expect(box.teamOnly).toMatchObject({ dreb: 1, reb: 1 })
    expect(box.team).toMatchObject({ pts: 6, reb: 1, pf: 1 })
  })

  it('counts team fouls per period', () => {
    expect(teamFouls(g, 'us', 1)).toBe(1)
    expect(teamFouls(g, 'them', 1)).toBe(0)
    expect(teamFouls(g, 'them', 2)).toBe(1)
  })

  it('names periods including overtime', () => {
    expect(periodName(g, 2)).toBe('Q2')
    expect(periodName(g, 5)).toBe('OT')
    expect(periodName(g, 6)).toBe('OT2')
  })

  it('exports CSV', () => {
    const lines = boxScoreCsv(g).trim().split('\n')
    expect(lines[0].startsWith('#,Player,PTS')).toBe(true)
    expect(lines[1].startsWith('3,Ava,5,2,2,100%')).toBe(true)
    expect(lines).toHaveLength(6)
  })
})

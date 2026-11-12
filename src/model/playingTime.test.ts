import { describe, expect, it } from 'vitest'
import { playingTime, segmentsFor } from './playingTime'
import type { Game, Player } from './types'

const roster: Player[] = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'].map((n, i) => ({ id: n, name: n, number: String(i) }))
const game = (lineups: Record<string, string[]>, status: Game['status'] = 'live'): Game => ({
  id: 'g', teamId: 't', teamName: 'Hawks', opponent: 'Eagles', date: '2026-11-12',
  periodCount: 4, periodLabel: 'Q', currentPeriod: 1, status, roster, events: [], lineups,
})

describe('segmentsFor', () => {
  it('splits first-half quarters into 3-minute segments by default', () => {
    const segs = segmentsFor(game({}))
    expect(segs.map((s) => s.label)).toEqual(['Q1-A', 'Q1-B', 'Q2-A', 'Q2-B', 'Q3', 'Q4'])
    expect(segs.map((s) => s.minutes)).toEqual([3, 3, 3, 3, 6, 6])
  })

  it('respects settings', () => {
    expect(segmentsFor({ periodCount: 4, periodLabel: 'Q', periodMinutes: 8, splitFirstHalf: false }).map((s) => s.minutes))
      .toEqual([8, 8, 8, 8])
    expect(segmentsFor({ periodCount: 2, periodLabel: 'H', periodMinutes: 20 }).map((s) => s.label)).toEqual(['H1', 'H2'])
  })
})

describe('playingTime', () => {
  const full = {
    '1a': ['A', 'B', 'C', 'D', 'E'],
    '1b': ['F', 'G', 'H', 'A', 'B'],
    '2a': ['C', 'D', 'E', 'F', 'G'],
    '2b': ['H', 'A', 'B', 'C', 'D'],
    '3': ['A', 'B', 'C', 'D', 'E'],
    '4': ['F', 'H', 'A', 'B', 'C'],
  }

  it('computes minutes and flags players under half the game', () => {
    const pt = playingTime(game(full, 'final'))
    const by = Object.fromEntries(pt.players.map((p) => [p.player.id, p]))
    expect(pt.totalMinutes).toBe(24)
    expect(pt.target).toBe(12)
    expect(by.A.minutes).toBe(21)
    expect(by.A.status).toBe('met')
    expect(by.E.minutes).toBe(12)
    expect(by.E.status).toBe('met')
    expect(by.H.minutes).toBe(12)
    expect(by.G.minutes).toBe(6)
    expect(by.G.status).toBe('short')
    expect(by.G.segments.map((s) => s.label)).toEqual(['Q1-B', 'Q2-A'])
    expect(pt.complete).toBe(true)
  })

  it('projects status while the game is in progress', () => {
    const pt = playingTime(game({ '1a': full['1a'], '1b': full['1b'], '2a': full['2a'] }))
    const by = Object.fromEntries(pt.players.map((p) => [p.player.id, p]))
    expect(pt.missing.map((s) => s.id)).toEqual(['2b', '3', '4'])
    expect(by.A.status).toBe('on-track') // 6 min, needs 6 of 15 remaining
    expect(by.H.status).toBe('at-risk') // 3 min, needs 9 of 15 remaining
  })

  it('flags lineups without exactly 5 players', () => {
    const pt = playingTime(game({ '1a': ['A', 'B', 'C', 'D'] }))
    expect(pt.irregular).toEqual([{ segment: expect.objectContaining({ id: '1a' }), count: 4 }])
  })
})

import type { Game, Id, Player, Segment } from './types'

export const PLAYERS_ON_FLOOR = 5
export const DEFAULT_PERIOD_MINUTES = 6

export function segmentsFor(
  game: Pick<Game, 'periodCount' | 'periodLabel' | 'periodMinutes' | 'splitFirstHalf'>,
): Segment[] {
  const mins = game.periodMinutes ?? DEFAULT_PERIOD_MINUTES
  const split = game.splitFirstHalf ?? game.periodLabel === 'Q'
  const firstHalfPeriods = game.periodLabel === 'Q' ? game.periodCount / 2 : 1
  const out: Segment[] = []
  for (let period = 1; period <= game.periodCount; period++) {
    const name = `${game.periodLabel}${period}`
    if (split && period <= firstHalfPeriods) {
      out.push({ id: `${period}a`, period, label: `${name}-A`, minutes: mins / 2 })
      out.push({ id: `${period}b`, period, label: `${name}-B`, minutes: mins / 2 })
    } else {
      out.push({ id: `${period}`, period, label: name, minutes: mins })
    }
  }
  return out
}

export type TimeStatus = 'met' | 'on-track' | 'at-risk' | 'short'

export interface PlayerTime {
  player: Player
  segments: Segment[]
  minutes: number
  target: number
  status: TimeStatus
}

export interface PlayingTime {
  segments: Segment[]
  totalMinutes: number
  target: number
  players: PlayerTime[]
  /** Segments with no lineup recorded yet. */
  missing: Segment[]
  /** Segments whose recorded lineup isn't exactly PLAYERS_ON_FLOOR players. */
  irregular: { segment: Segment; count: number }[]
  /** True once every segment has a lineup recorded. */
  complete: boolean
}

/**
 * Credits each player with the full minutes of any segment she was on the
 * floor for, and checks that she reached half of the game's minutes.
 */
export function playingTime(game: Game): PlayingTime {
  const segments = segmentsFor(game)
  const lineups = game.lineups ?? {}
  const totalMinutes = segments.reduce((s, x) => s + x.minutes, 0)
  const target = totalMinutes / 2
  const recorded = segments.filter((s) => lineups[s.id] !== undefined)
  const missing = segments.filter((s) => lineups[s.id] === undefined)
  const remaining = missing.reduce((s, x) => s + x.minutes, 0)

  const players = game.roster.map((player): PlayerTime => {
    const played = recorded.filter((s) => lineups[s.id].includes(player.id))
    const minutes = played.reduce((s, x) => s + x.minutes, 0)
    let status: TimeStatus
    if (minutes >= target) status = 'met'
    else if (missing.length === 0 || game.status === 'final') status = 'short'
    else if (minutes + remaining < target) status = 'short'
    else {
      // At risk if she'd need more than her fair share of what's left.
      const needed = target - minutes
      status = needed > remaining / 2 ? 'at-risk' : 'on-track'
    }
    return { player, segments: played, minutes, target, status }
  })

  return {
    segments,
    totalMinutes,
    target,
    players,
    missing,
    irregular: recorded
      .map((segment) => ({ segment, count: lineups[segment.id].length }))
      .filter((x) => x.count !== PLAYERS_ON_FLOOR),
    complete: missing.length === 0,
  }
}

export function onFloor(game: Game, segmentId: string): Id[] {
  return game.lineups?.[segmentId] ?? []
}

export function formatMinutes(m: number): string {
  return Number.isInteger(m) ? String(m) : m.toFixed(1)
}

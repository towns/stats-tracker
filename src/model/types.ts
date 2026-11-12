export type Id = string

export interface Player {
  id: Id
  name: string
  number: string
}

export interface Team {
  id: Id
  name: string
  players: Player[]
}

export type Side = 'us' | 'them'

export type StatKind =
  | 'fg2_made'
  | 'fg2_miss'
  | 'fg3_made'
  | 'fg3_miss'
  | 'ft_made'
  | 'ft_miss'
  | 'oreb'
  | 'dreb'
  | 'ast'
  | 'stl'
  | 'blk'
  | 'tov'
  | 'foul'

/**
 * A single thing that happened in a game. Games are stored as an append-only
 * list of events; every stat (score, box score, fouls) is derived from them.
 * `playerId` is omitted for team-level events (e.g. team rebound) and for
 * opponent events.
 */
export interface GameEvent {
  id: Id
  at: number
  period: number
  side: Side
  kind: StatKind
  playerId?: Id
}

export interface Game {
  id: Id
  teamId: Id
  teamName: string
  opponent: string
  date: string
  periodCount: number
  periodLabel: 'Q' | 'H'
  currentPeriod: number
  /** Snapshot of the roster at game time so later roster edits don't rewrite history. */
  roster: Player[]
  events: GameEvent[]
  status: 'live' | 'final'
}

import type { Game, Id, Player, Team } from './types'
import { playingTime } from './playingTime'
import { BOX_COLUMNS, addLines, boxScore, emptyLine, scaleLine, type StatLine } from './stats'

export type Result = 'W' | 'L' | 'T'

export interface GameResult {
  game: Game
  us: number
  them: number
  /** Undefined while the game is still live. */
  result?: Result
}

export interface PlayerSeason {
  player: Player
  gp: number
  totals: StatLine
  /** Minutes played, from games where lineups were recorded. */
  minutes: number
  /** Games with lineups recorded that this player was on the roster for. */
  trackedGames: number
  /** Final games where the player fell short of half the game. */
  shortGames: number
}

export interface SeasonSummary {
  results: GameResult[]
  wins: number
  losses: number
  ties: number
  gp: number
  team: StatLine
  opponent: StatLine
  players: PlayerSeason[]
}

/**
 * Aggregates a team's games into season totals. Players are matched across
 * games by id; `team` (if given) supplies current names/numbers.
 */
export function seasonSummary(games: Game[], team?: Team): SeasonSummary {
  const sorted = [...games].sort((a, b) => a.date.localeCompare(b.date))
  const players = new Map<Id, PlayerSeason>()
  let teamLine = emptyLine()
  let oppLine = emptyLine()
  const results: GameResult[] = []

  for (const game of sorted) {
    const box = boxScore(game)
    const pt = playingTime(game)
    const tracked = Object.keys(game.lineups ?? {}).length > 0
    teamLine = addLines(teamLine, box.team)
    oppLine = addLines(oppLine, box.opponent)
    const us = box.team.pts
    const them = box.opponent.pts
    results.push({
      game, us, them,
      result: game.status === 'final' ? (us > them ? 'W' : us < them ? 'L' : 'T') : undefined,
    })
    for (const p of game.roster) {
      const prev = players.get(p.id)
      const time = pt.players.find((x) => x.player.id === p.id)
      players.set(p.id, {
        player: p,
        gp: (prev?.gp ?? 0) + 1,
        totals: addLines(prev?.totals ?? emptyLine(), box.players[p.id]),
        minutes: (prev?.minutes ?? 0) + (tracked ? time?.minutes ?? 0 : 0),
        trackedGames: (prev?.trackedGames ?? 0) + (tracked ? 1 : 0),
        shortGames: (prev?.shortGames ?? 0) + (tracked && game.status === 'final' && time?.status === 'short' ? 1 : 0),
      })
    }
  }

  for (const ps of players.values()) {
    const current = team?.players.find((p) => p.id === ps.player.id)
    if (current) ps.player = current
  }

  return {
    results,
    wins: results.filter((r) => r.result === 'W').length,
    losses: results.filter((r) => r.result === 'L').length,
    ties: results.filter((r) => r.result === 'T').length,
    gp: sorted.length,
    team: teamLine,
    opponent: oppLine,
    players: [...players.values()].sort(
      (a, b) => Number(a.player.number) - Number(b.player.number) || a.player.number.localeCompare(b.player.number),
    ),
  }
}

export function perGame(l: StatLine, gp: number): StatLine {
  return scaleLine(l, gp)
}

export function record(s: Pick<SeasonSummary, 'wins' | 'losses' | 'ties'>): string {
  return s.ties ? `${s.wins}-${s.losses}-${s.ties}` : `${s.wins}-${s.losses}`
}

export function formatStat(v: string | number, decimals: number): string {
  return typeof v === 'number' ? v.toFixed(decimals) : v
}

function csvCell(v: string | number): string {
  const s = String(v)
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

export function seasonCsv(s: SeasonSummary, mode: 'totals' | 'avg'): string {
  const dec = mode === 'avg' ? 1 : 0
  const val = (l: StatLine, gp: number) => (mode === 'avg' ? perGame(l, gp) : l)
  const row = (num: string, name: string, gp: number, l: StatLine) =>
    [num, name, gp, ...BOX_COLUMNS.map(([, f]) => formatStat(f(val(l, gp)), dec))].map(csvCell).join(',')
  return [
    ['#', 'Player', 'GP', ...BOX_COLUMNS.map(([h]) => h)].join(','),
    ...s.players.map((p) => row(p.player.number, p.player.name, p.gp, p.totals)),
    row('', 'TEAM', s.gp, s.team),
    row('', 'OPPONENTS', s.gp, s.opponent),
  ].join('\n') + '\n'
}

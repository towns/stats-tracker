import type { Game, GameEvent, Id, Side, StatKind } from './types'

export interface StatLine {
  pts: number
  fgm: number
  fga: number
  fg3m: number
  fg3a: number
  ftm: number
  fta: number
  oreb: number
  dreb: number
  reb: number
  ast: number
  stl: number
  blk: number
  tov: number
  pf: number
}

export const POINTS: Partial<Record<StatKind, number>> = {
  fg2_made: 2,
  fg3_made: 3,
  ft_made: 1,
}

export function emptyLine(): StatLine {
  return {
    pts: 0, fgm: 0, fga: 0, fg3m: 0, fg3a: 0, ftm: 0, fta: 0,
    oreb: 0, dreb: 0, reb: 0, ast: 0, stl: 0, blk: 0, tov: 0, pf: 0,
  }
}

export function addEvent(line: StatLine, kind: StatKind): StatLine {
  const l = { ...line }
  switch (kind) {
    case 'fg2_made': l.fgm++; l.fga++; l.pts += 2; break
    case 'fg2_miss': l.fga++; break
    case 'fg3_made': l.fgm++; l.fga++; l.fg3m++; l.fg3a++; l.pts += 3; break
    case 'fg3_miss': l.fga++; l.fg3a++; break
    case 'ft_made': l.ftm++; l.fta++; l.pts += 1; break
    case 'ft_miss': l.fta++; break
    case 'oreb': l.oreb++; l.reb++; break
    case 'dreb': l.dreb++; l.reb++; break
    case 'ast': l.ast++; break
    case 'stl': l.stl++; break
    case 'blk': l.blk++; break
    case 'tov': l.tov++; break
    case 'foul': l.pf++; break
  }
  return l
}

export function lineFor(events: GameEvent[]): StatLine {
  return events.reduce((l, e) => addEvent(l, e.kind), emptyLine())
}

export interface BoxScore {
  players: Record<Id, StatLine>
  /** Events credited to the team but no specific player. */
  teamOnly: StatLine
  team: StatLine
  opponent: StatLine
  periodScores: { us: number[]; them: number[] }
}

export function periodsPlayed(game: Game): number {
  const maxEvent = game.events.reduce((m, e) => Math.max(m, e.period), 0)
  return Math.max(game.periodCount, game.currentPeriod, maxEvent)
}

export function boxScore(game: Game): BoxScore {
  const ours = game.events.filter((e) => e.side === 'us')
  const theirs = game.events.filter((e) => e.side === 'them')
  const players: Record<Id, StatLine> = {}
  for (const p of game.roster) {
    players[p.id] = lineFor(ours.filter((e) => e.playerId === p.id))
  }
  const n = periodsPlayed(game)
  const periodScore = (side: Side) =>
    Array.from({ length: n }, (_, i) => score(game, side, i + 1))
  return {
    players,
    teamOnly: lineFor(ours.filter((e) => !e.playerId)),
    team: lineFor(ours),
    opponent: lineFor(theirs),
    periodScores: { us: periodScore('us'), them: periodScore('them') },
  }
}

export function score(game: Game, side: Side, period?: number): number {
  return game.events
    .filter((e) => e.side === side && (period === undefined || e.period === period))
    .reduce((s, e) => s + (POINTS[e.kind] ?? 0), 0)
}

export function teamFouls(game: Game, side: Side, period: number): number {
  return game.events.filter(
    (e) => e.side === side && e.period === period && e.kind === 'foul',
  ).length
}

export function playerFouls(game: Game, playerId: Id): number {
  return game.events.filter((e) => e.playerId === playerId && e.kind === 'foul').length
}

export function pct(made: number, att: number): string {
  if (att === 0) return '–'
  return `${Math.round((made / att) * 100)}%`
}

export function periodName(game: Pick<Game, 'periodCount' | 'periodLabel'>, period: number): string {
  if (period > game.periodCount) {
    const ot = period - game.periodCount
    return ot === 1 ? 'OT' : `OT${ot}`
  }
  return `${game.periodLabel}${period}`
}

export const KIND_LABEL: Record<StatKind, string> = {
  fg2_made: '2PT made',
  fg2_miss: '2PT miss',
  fg3_made: '3PT made',
  fg3_miss: '3PT miss',
  ft_made: 'FT made',
  ft_miss: 'FT miss',
  oreb: 'Off. rebound',
  dreb: 'Def. rebound',
  ast: 'Assist',
  stl: 'Steal',
  blk: 'Block',
  tov: 'Turnover',
  foul: 'Foul',
}

const COLUMNS: [string, (l: StatLine) => string | number][] = [
  ['PTS', (l) => l.pts],
  ['FGM', (l) => l.fgm],
  ['FGA', (l) => l.fga],
  ['FG%', (l) => pct(l.fgm, l.fga)],
  ['3PM', (l) => l.fg3m],
  ['3PA', (l) => l.fg3a],
  ['FTM', (l) => l.ftm],
  ['FTA', (l) => l.fta],
  ['FT%', (l) => pct(l.ftm, l.fta)],
  ['OREB', (l) => l.oreb],
  ['DREB', (l) => l.dreb],
  ['REB', (l) => l.reb],
  ['AST', (l) => l.ast],
  ['STL', (l) => l.stl],
  ['BLK', (l) => l.blk],
  ['TO', (l) => l.tov],
  ['PF', (l) => l.pf],
]

export const BOX_COLUMNS = COLUMNS

function csvCell(v: string | number): string {
  const s = String(v)
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

export function boxScoreCsv(game: Game): string {
  const box = boxScore(game)
  const header = ['#', 'Player', ...COLUMNS.map(([h]) => h)]
  const row = (num: string, name: string, l: StatLine) =>
    [num, name, ...COLUMNS.map(([, f]) => f(l))].map(csvCell).join(',')
  const rows = [
    header.join(','),
    ...game.roster.map((p) => row(p.number, p.name, box.players[p.id])),
    row('', 'Team', box.teamOnly),
    row('', 'TOTAL', box.team),
    row('', game.opponent, box.opponent),
  ]
  return rows.join('\n') + '\n'
}

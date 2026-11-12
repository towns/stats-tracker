import { useCallback, useEffect, useState } from 'react'
import type { Game, GameEvent, Id, Side, StatKind, Team } from './model/types'

const KEY = 'stats-tracker:v1'

export interface AppState {
  teams: Team[]
  games: Game[]
}

export const newId = (): Id =>
  crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`

function load(): AppState {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) return JSON.parse(raw) as AppState
  } catch {
    /* ignore corrupt storage */
  }
  return { teams: [], games: [] }
}

export function demoTeam(): Team {
  const names = ['Ava', 'Bella', 'Chloe', 'Daisy', 'Emma', 'Fiona', 'Grace', 'Hannah', 'Isla', 'Julia']
  const nums = ['3', '5', '10', '11', '12', '14', '21', '22', '24', '33']
  return {
    id: newId(),
    name: 'Demo Team',
    players: names.map((name, i) => ({ id: newId(), name, number: nums[i] })),
  }
}

export type GameSettings = Pick<
  Game,
  'opponent' | 'date' | 'periodCount' | 'periodLabel' | 'periodMinutes' | 'splitFirstHalf' | 'roster'
>

export function useStore() {
  const [state, setState] = useState<AppState>(load)

  useEffect(() => {
    localStorage.setItem(KEY, JSON.stringify(state))
  }, [state])

  const updateGame = useCallback((id: Id, fn: (g: Game) => Game) => {
    setState((s) => ({ ...s, games: s.games.map((g) => (g.id === id ? fn(g) : g)) }))
  }, [])

  return {
    state,
    saveTeam: (team: Team) =>
      setState((s) => ({
        ...s,
        teams: s.teams.some((t) => t.id === team.id)
          ? s.teams.map((t) => (t.id === team.id ? team : t))
          : [...s.teams, team],
      })),
    deleteTeam: (id: Id) => setState((s) => ({ ...s, teams: s.teams.filter((t) => t.id !== id) })),
    createGame: (team: Team, settings: GameSettings): Game => {
      const game: Game = {
        id: newId(), teamId: team.id, teamName: team.name, currentPeriod: 1, events: [], status: 'live',
        lineups: {}, ...settings,
      }
      setState((s) => ({ ...s, games: [game, ...s.games] }))
      return game
    },
    deleteGame: (id: Id) => setState((s) => ({ ...s, games: s.games.filter((g) => g.id !== id) })),
    record: (gameId: Id, side: Side, kind: StatKind, playerId?: Id) =>
      updateGame(gameId, (g) => {
        const e: GameEvent = { id: newId(), at: Date.now(), period: g.currentPeriod, side, kind }
        if (playerId) e.playerId = playerId
        return { ...g, events: [...g.events, e] }
      }),
    removeEvent: (gameId: Id, eventId: Id) =>
      updateGame(gameId, (g) => ({ ...g, events: g.events.filter((e) => e.id !== eventId) })),
    setPeriod: (gameId: Id, period: number) =>
      updateGame(gameId, (g) => ({ ...g, currentPeriod: Math.max(1, period) })),
    setLineup: (gameId: Id, segmentId: string, playerIds: Id[]) =>
      updateGame(gameId, (g) => {
        const lineups = { ...g.lineups }
        if (playerIds.length) lineups[segmentId] = playerIds
        else delete lineups[segmentId]
        return { ...g, lineups }
      }),
    setStatus: (gameId: Id, status: Game['status']) =>
      updateGame(gameId, (g) => ({ ...g, status })),
  }
}

export type Store = ReturnType<typeof useStore>

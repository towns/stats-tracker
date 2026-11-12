# Stat Tracker

A touch-friendly web app for tracking youth basketball player and team stats during a game.

## Run

```sh
npm install
npm run dev     # http://localhost:5173
npm test        # model unit tests
npm run build
```

## How it works

- **Teams & rosters** – create a team, add players (# and name).
- **Start a game** – pick opponent, date, quarters/halves, and who's present.
- **Live tracking** – tap a player then a stat (or a stat then a player). Opponent scoring/fouls have their own buttons. Undo or delete any entry from the play log.
- **Box score** – per-player and team totals, scoring by period, CSV export, print.

Data is saved in the browser's `localStorage`.

## Data model

All game data lives in `src/model/` with no UI dependencies, so it can be ported to an iPad app later.

A `Game` is a roster snapshot plus an append-only list of `GameEvent`s
(`{ period, side: 'us' | 'them', kind, playerId? }`). Every number shown — score, period scores, fouls, box score —
is derived from those events in `src/model/stats.ts`. That makes undo/edit trivial and lets new stats be added
later without migrating stored games.

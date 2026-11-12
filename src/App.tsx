import { useEffect, useState } from 'react'
import { useStore } from './store'
import Home from './views/Home'
import TeamEditor from './views/TeamEditor'
import NewGame from './views/NewGame'
import LiveGame from './views/LiveGame'
import BoxScoreView from './views/BoxScoreView'
import SeasonView from './views/SeasonView'

function useHashRoute(): string[] {
  const parse = () => window.location.hash.replace(/^#\/?/, '').split('/').filter(Boolean)
  const [route, setRoute] = useState(parse)
  useEffect(() => {
    const onChange = () => setRoute(parse())
    window.addEventListener('hashchange', onChange)
    return () => window.removeEventListener('hashchange', onChange)
  }, [])
  return route
}

export default function App() {
  const store = useStore()
  const [section, id, sub] = useHashRoute()

  if (section === 'team') return <TeamEditor store={store} teamId={id} />
  if (section === 'season') return <SeasonView store={store} teamId={id} />
  if (section === 'new-game') return <NewGame store={store} teamId={id} />
  if (section === 'game' && id) {
    const game = store.state.games.find((g) => g.id === id)
    if (!game) return <NotFound />
    return sub === 'box' ? <BoxScoreView store={store} game={game} /> : <LiveGame store={store} game={game} />
  }
  return <Home store={store} />
}

function NotFound() {
  return (
    <div className="page">
      <p>Not found.</p>
      <a href="#/">Home</a>
    </div>
  )
}

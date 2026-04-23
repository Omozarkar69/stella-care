import { useState } from 'react'
import { useFreighter } from './hooks/useFreighter'
import { Nav } from './components/Nav'
import { Landing } from './components/Landing'
import { Dashboard } from './components/Dashboard'
import { JoinPool } from './components/JoinPool'
import { Claims } from './components/Claims'
import { Governance } from './components/Governance'
import { About } from './components/About'

export type Page = 'home' | 'dashboard' | 'join' | 'claims' | 'governance' | 'about'

export default function App() {
  const [page, setPage] = useState<Page>('home')
  const freighter = useFreighter()

  return (
    <div className="app">
      <Nav page={page} setPage={setPage} freighter={freighter} />
      <main>
        {page === 'home'       && <Landing     onGetStarted={() => setPage('join')} />}
        {page === 'dashboard'  && <Dashboard   addr={freighter.address} />}
        {page === 'join'       && <JoinPool    addr={freighter.address} />}
        {page === 'claims'     && <Claims      addr={freighter.address} />}
        {page === 'governance' && <Governance  addr={freighter.address} />}
        {page === 'about'      && <About />}
      </main>
    </div>
  )
}

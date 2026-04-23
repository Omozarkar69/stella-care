import { useState } from 'react'
import { useFreighter } from './hooks/useFreighter'
import { Nav } from './components/Nav'
import { Dashboard } from './components/Dashboard'
import { JoinPool } from './components/JoinPool'
import { Claims } from './components/Claims'
import { Governance } from './components/Governance'

export type Page = 'dashboard' | 'join' | 'claims' | 'governance'

export default function App() {
  const [page, setPage] = useState<Page>('dashboard')
  const freighter = useFreighter()

  return (
    <div className="app">
      <Nav page={page} setPage={setPage} freighter={freighter} />
      <main>
        {page === 'dashboard'  && <Dashboard  addr={freighter.address} />}
        {page === 'join'       && <JoinPool   addr={freighter.address} />}
        {page === 'claims'     && <Claims     addr={freighter.address} />}
        {page === 'governance' && <Governance addr={freighter.address} />}
      </main>
    </div>
  )
}

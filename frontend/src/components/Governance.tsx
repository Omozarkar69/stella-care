import { useState, useEffect, useCallback } from 'react'
import { createProposal, voteProposal, executeProposal, getProposal, isMember } from '../lib/stellar'

type Props = { addr: string | null }

type ProposalRow = { id: number; data: Record<string, unknown> }

// helper — read proposal count from chain
async function getProposalCount(addr: string): Promise<number> {
  try {
    // PropCount is stored as instance storage key in health-pool
    // We probe by trying proposals 1..N until we get null
    // Use the simulate helper with 'get_proposal' and count up
    let n = 0
    for (let i = 1; i <= 100; i++) {
      const p = await getProposal(addr, BigInt(i))
      if (!p) break
      n = i
    }
    return n
  } catch {
    return 0
  }
}

export function Governance({ addr }: Props) {
  const [tab, setTab] = useState<'list' | 'create'>('list')
  const [memberStatus, setMemberStatus] = useState<boolean | null>(null)

  // ── proposals list ────────────────────────────────────────────────────────
  const [proposals, setProposals] = useState<ProposalRow[]>([])
  const [listLoading, setListLoading] = useState(false)
  const [listErr, setListErr] = useState('')
  const [expanded, setExpanded] = useState<number | null>(null)

  // ── vote / execute state ──────────────────────────────────────────────────
  const [voting, setVoting] = useState(false)
  const [executing, setExecuting] = useState(false)
  const [actionOk, setActionOk] = useState('')
  const [actionErr, setActionErr] = useState('')

  // ── create state ──────────────────────────────────────────────────────────
  const [desc, setDesc] = useState('')
  const [newContrib, setNewContrib] = useState('')
  const [creating, setCreating] = useState(false)
  const [createOk, setCreateOk] = useState('')
  const [createErr, setCreateErr] = useState('')
  const [newProposalId, setNewProposalId] = useState<number | null>(null)

  useEffect(() => {
    if (!addr) return
    isMember(addr).then(setMemberStatus).catch(() => setMemberStatus(null))
  }, [addr])

  const loadProposals = useCallback(async () => {
    if (!addr) return
    setListLoading(true); setListErr(''); setProposals([])
    try {
      const rows: ProposalRow[] = []
      // probe proposals 1..N until we get null
      for (let i = 1; i <= 200; i++) {
        const p = await getProposal(addr, BigInt(i))
        if (!p) break
        rows.push({ id: i, data: p as Record<string, unknown> })
      }
      setProposals(rows)
    } catch (e: unknown) {
      setListErr(e instanceof Error ? e.message : 'Failed to load proposals')
    } finally {
      setListLoading(false)
    }
  }, [addr])

  useEffect(() => {
    if (tab === 'list' && addr) loadProposals()
  }, [tab, addr, loadProposals])

  async function vote(pid: number, approve: boolean) {
    if (!addr) return
    setVoting(true); setActionOk(''); setActionErr('')
    try {
      await voteProposal(addr, BigInt(pid), approve)
      setActionOk(`Voted ${approve ? 'For ✓' : 'Against ✗'} proposal #${pid}.`)
      setExpanded(null)
      loadProposals()
    } catch (e: unknown) {
      setActionErr(e instanceof Error ? e.message : 'Failed')
    } finally {
      setVoting(false)
    }
  }

  async function execute(pid: number) {
    if (!addr) return
    setExecuting(true); setActionOk(''); setActionErr('')
    try {
      await executeProposal(addr, BigInt(pid))
      setActionOk(`Proposal #${pid} executed. Pool contribution updated.`)
      setExpanded(null)
      loadProposals()
    } catch (e: unknown) {
      setActionErr(e instanceof Error ? e.message : 'Failed')
    } finally {
      setExecuting(false)
    }
  }

  async function create(e: React.FormEvent) {
    e.preventDefault()
    if (!addr || !desc || !newContrib) return
    setCreating(true); setCreateOk(''); setCreateErr(''); setNewProposalId(null)
    try {
      const stroops = BigInt(Math.round(parseFloat(newContrib) * 1e7))
      const id = await createProposal(addr, desc, stroops)
      const idNum = Number(id)
      setNewProposalId(idNum)
      setCreateOk(`Proposal #${idNum} created on-chain!`)
      setDesc(''); setNewContrib('')
    } catch (e: unknown) {
      setCreateErr(e instanceof Error ? e.message : 'Failed')
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="page">
      <div style={{ marginBottom: '1.75rem' }}>
        <h1 style={{ marginBottom: '.375rem' }}>Governance</h1>
        <p>CARE token holders vote on pool parameters. All proposals and votes are on-chain.</p>
      </div>

      {!addr && <div className="alert alert-warn" style={{ marginBottom: '1.5rem' }}><span>⚠</span><span>Connect your wallet.</span></div>}
      {addr && memberStatus === false && (
        <div className="alert alert-warn" style={{ marginBottom: '1.5rem' }}>
          <span>⚠</span><span>You must be a pool member to create proposals or vote. Go to <strong>Join Pool</strong> first.</span>
        </div>
      )}

      <div className="tabs">
        <button className={`tab ${tab === 'list' ? 'on' : ''}`} onClick={() => setTab('list')}>All Proposals</button>
        <button className={`tab ${tab === 'create' ? 'on' : ''}`} onClick={() => setTab('create')}>Create Proposal</button>
      </div>

      {/* ── ALL PROPOSALS LIST ── */}
      {tab === 'list' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <span style={{ fontSize: '.875rem', color: '#78716c' }}>
              {listLoading ? 'Loading…' : `${proposals.length} proposal${proposals.length !== 1 ? 's' : ''} on-chain`}
            </span>
            <button className="btn btn-outline btn-sm" onClick={loadProposals} disabled={!addr || listLoading}>
              {listLoading ? <span className="spin" /> : '↻ Refresh'}
            </button>
          </div>

          {actionOk && <div className="alert alert-success" style={{ marginBottom: '1rem' }}><span>✓</span><span>{actionOk}</span></div>}
          {actionErr && <div className="alert alert-error" style={{ marginBottom: '1rem' }}><span>⚠</span><span>{actionErr}</span></div>}
          {listErr && <div className="alert alert-error" style={{ marginBottom: '1rem' }}><span>⚠</span><span>{listErr}</span></div>}

          {listLoading && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem', color: '#78716c', fontSize: '.875rem', padding: '2rem 0' }}>
              <span className="spin" />Loading proposals from chain…
            </div>
          )}

          {!listLoading && proposals.length === 0 && !listErr && (
            <div className="card" style={{ textAlign: 'center', padding: '2.5rem', color: '#78716c' }}>
              <div style={{ fontSize: '2rem', marginBottom: '.75rem' }}>🗳</div>
              <div style={{ fontWeight: 600, marginBottom: '.25rem' }}>No proposals yet</div>
              <div style={{ fontSize: '.875rem' }}>Create the first governance proposal.</div>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '.75rem' }}>
            {proposals.map(({ id, data }) => {
              const isOpen = expanded === id
              const isExecuted = Boolean(data.executed)
              const forV = Number(data.for_v as number)
              const againstV = Number(data.against_v as number)
              const total = forV + againstV
              const forPct = total > 0 ? Math.round((forV / total) * 100) : 0
              const canExecute = !isExecuted && forV > againstV && forV > 0

              return (
                <div key={id} className="card" style={{ padding: '1rem 1.25rem' }}>
                  {/* header */}
                  <div
                    style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', gap: '1rem' }}
                    onClick={() => setExpanded(isOpen ? null : id)}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem', minWidth: 0 }}>
                      <span style={{
                        background: isExecuted ? '#16a34a' : '#f97316',
                        color: '#fff', borderRadius: 6,
                        padding: '.15rem .5rem', fontSize: '.75rem', fontWeight: 700, flexShrink: 0,
                      }}>#{id}</span>
                      <span style={{ fontSize: '.875rem', color: '#44403c', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {String(data.desc)}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', flexShrink: 0 }}>
                      <span className={`badge ${isExecuted ? 'badge-green' : 'badge-orange'}`}>
                        {isExecuted ? 'Executed' : 'Active'}
                      </span>
                      <span style={{ fontSize: '.75rem', color: '#a8a29e' }}>{isOpen ? '▲' : '▼'}</span>
                    </div>
                  </div>

                  {/* expanded detail */}
                  {isOpen && (
                    <div style={{ marginTop: '1rem', borderTop: '1px solid #f5f5f4', paddingTop: '1rem' }}>
                      <div className="row">
                        <span className="row-lbl">New Contribution</span>
                        <strong>{(Number(data.new_contrib as bigint) / 1e7).toFixed(2)} XLM/mo</strong>
                      </div>
                      <div className="row">
                        <span className="row-lbl">Votes</span>
                        <span>
                          <strong style={{ color: '#16a34a' }}>{forV} For</strong>
                          {' · '}
                          <strong style={{ color: '#dc2626' }}>{againstV} Against</strong>
                        </span>
                      </div>

                      {total > 0 && (
                        <div style={{ margin: '.875rem 0' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.75rem', color: '#78716c', marginBottom: '.35rem' }}>
                            <span>For {forPct}%</span><span>Against {100 - forPct}%</span>
                          </div>
                          <div className="bar-track"><div className="bar-fill green" style={{ width: `${forPct}%` }} /></div>
                        </div>
                      )}

                      {!isExecuted && addr && (
                        <div style={{ display: 'flex', gap: '.5rem', marginTop: '.875rem' }}>
                          <button className="btn btn-success" style={{ flex: 1 }} onClick={() => vote(id, true)} disabled={voting}>
                            {voting ? <span className="spin" /> : '✓ Vote For'}
                          </button>
                          <button className="btn btn-danger" style={{ flex: 1 }} onClick={() => vote(id, false)} disabled={voting}>
                            {voting ? <span className="spin" /> : '✗ Vote Against'}
                          </button>
                        </div>
                      )}
                      {canExecute && addr && (
                        <button className="btn btn-primary btn-full" style={{ marginTop: '.5rem' }} onClick={() => execute(id)} disabled={executing}>
                          {executing ? <><span className="spin" /> Executing…</> : 'Execute Proposal'}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── CREATE PROPOSAL ── */}
      {tab === 'create' && (
        <div style={{ maxWidth: 560 }}>
          <div className="card">
            <h2 style={{ marginBottom: '.5rem' }}>New Proposal</h2>
            <p style={{ marginBottom: '1.25rem' }}>Propose a change to the pool monthly contribution. Requires CARE tokens.</p>

            {/* Prominent proposal ID after creation */}
            {newProposalId !== null && (
              <div style={{
                background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10,
                padding: '1.25rem', marginBottom: '1rem', textAlign: 'center',
              }}>
                <div style={{ fontSize: '.8rem', color: '#16a34a', fontWeight: 600, marginBottom: '.375rem', textTransform: 'uppercase', letterSpacing: '.04em' }}>
                  Proposal Created ✓
                </div>
                <div style={{ fontSize: '2.5rem', fontWeight: 800, color: '#15803d', letterSpacing: '-.03em', lineHeight: 1 }}>
                  #{newProposalId}
                </div>
                <div style={{ fontSize: '.8rem', color: '#166534', marginTop: '.5rem' }}>
                  Share this number so others can find and vote on your proposal.
                </div>
                <button
                  className="btn btn-outline btn-sm"
                  style={{ marginTop: '.75rem' }}
                  onClick={() => navigator.clipboard.writeText(String(newProposalId))}
                >
                  Copy #
                </button>
              </div>
            )}

            {createErr && <div className="alert alert-error" style={{ marginBottom: '1rem' }}><span>⚠</span><span>{createErr}</span></div>}

            <form onSubmit={create} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div className="field">
                <label>Description</label>
                <textarea placeholder="Explain the change…" value={desc} onChange={e => setDesc(e.target.value)} required />
              </div>
              <div className="field">
                <label>New Monthly Contribution (XLM)</label>
                <input type="number" placeholder="e.g. 150" value={newContrib} onChange={e => setNewContrib(e.target.value)} min="1" required />
              </div>
              <button type="submit" className="btn btn-primary btn-full" disabled={!addr || creating}>
                {creating ? <><span className="spin" /> Submitting…</> : 'Create Proposal'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

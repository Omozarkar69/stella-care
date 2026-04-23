import { useState, useEffect } from 'react'
import { createProposal, voteProposal, executeProposal, getProposal, isMember } from '../lib/stellar'

type Props = { addr: string | null }

export function Governance({ addr }: Props) {
  const [tab, setTab] = useState<'vote'|'create'>('vote')
  const [memberStatus, setMemberStatus] = useState<boolean | null>(null)

  useEffect(() => {
    if (!addr) return
    isMember(addr).then(setMemberStatus).catch(() => setMemberStatus(null))
  }, [addr])
  const [pid, setPid] = useState('')
  const [proposal, setProposal] = useState<Record<string,unknown>|null>(null)
  const [lookupLoading, setLookupLoading] = useState(false)
  const [lookupErr, setLookupErr] = useState('')
  const [voting, setVoting] = useState(false)
  const [executing, setExecuting] = useState(false)
  const [actionOk, setActionOk] = useState('')
  const [actionErr, setActionErr] = useState('')
  const [desc, setDesc] = useState('')
  const [newContrib, setNewContrib] = useState('')
  const [creating, setCreating] = useState(false)
  const [createOk, setCreateOk] = useState('')
  const [createErr, setCreateErr] = useState('')

  async function lookup() {
    if (!addr || !pid) return
    setLookupLoading(true); setLookupErr(''); setProposal(null)
    try {
      const p = await getProposal(addr, BigInt(pid))
      if (!p) { setLookupErr('Proposal not found'); return }
      setProposal(p as Record<string,unknown>)
    } catch (e: unknown) { setLookupErr(e instanceof Error ? e.message : 'Not found') }
    finally { setLookupLoading(false) }
  }

  async function vote(approve: boolean) {
    if (!addr || !pid) return
    setVoting(true); setActionOk(''); setActionErr('')
    try {
      await voteProposal(addr, BigInt(pid), approve)
      setActionOk(`Voted ${approve ? 'For' : 'Against'} proposal #${pid}.`)
      setProposal(null); setPid('')
    } catch (e: unknown) { setActionErr(e instanceof Error ? e.message : 'Failed') }
    finally { setVoting(false) }
  }

  async function execute() {
    if (!addr || !pid) return
    setExecuting(true); setActionOk(''); setActionErr('')
    try {
      await executeProposal(addr, BigInt(pid))
      setActionOk(`Proposal #${pid} executed. Pool contribution updated.`)
      setProposal(null); setPid('')
    } catch (e: unknown) { setActionErr(e instanceof Error ? e.message : 'Failed') }
    finally { setExecuting(false) }
  }

  async function create(e: React.FormEvent) {
    e.preventDefault()
    if (!addr || !desc || !newContrib) return
    setCreating(true); setCreateOk(''); setCreateErr('')
    try {
      const stroops = BigInt(Math.round(parseFloat(newContrib) * 1e7))
      const id = await createProposal(addr, desc, stroops)
      setCreateOk(`Proposal #${id} created on-chain.`)
      setDesc(''); setNewContrib('')
    } catch (e: unknown) { setCreateErr(e instanceof Error ? e.message : 'Failed') }
    finally { setCreating(false) }
  }

  const total = proposal ? Number(proposal.for_v as number) + Number(proposal.against_v as number) : 0
  const forPct = total > 0 ? Math.round((Number(proposal!.for_v as number) / total) * 100) : 0

  return (
    <div className="page">
      <div style={{ marginBottom:'1.75rem' }}>
        <h1 style={{ marginBottom:'.375rem' }}>Governance</h1>
        <p>CARE token holders vote on pool parameters. All proposals and votes are on-chain.</p>
      </div>
      {!addr && <div className="alert alert-warn" style={{ marginBottom:'1.5rem' }}><span>⚠</span><span>Connect your wallet.</span></div>}
      {addr && memberStatus === false && (
        <div className="alert alert-warn" style={{ marginBottom:'1.5rem' }}>
          <span>⚠</span>
          <span>You must be a pool member to create proposals or vote. Go to <strong>Join Pool</strong> first.</span>
        </div>
      )}

      <div className="tabs">
        <button className={`tab ${tab==='vote'?'on':''}`} onClick={() => setTab('vote')}>Vote on Proposal</button>
        <button className={`tab ${tab==='create'?'on':''}`} onClick={() => setTab('create')}>Create Proposal</button>
      </div>

      {tab === 'vote' && (
        <div style={{ maxWidth:580 }}>
          <div className="card">
            <h2 style={{ marginBottom:'1rem' }}>Look up a proposal</h2>
            {actionOk  && <div className="alert alert-success" style={{ marginBottom:'1rem' }}><span>✓</span><span>{actionOk}</span></div>}
            {actionErr && <div className="alert alert-error"   style={{ marginBottom:'1rem' }}><span>⚠</span><span>{actionErr}</span></div>}

            <div style={{ display:'flex', gap:'.5rem', marginBottom:'1rem' }}>
              <div className="field" style={{ flex:1 }}>
                <label>Proposal ID</label>
                <input type="number" placeholder="e.g. 1" value={pid} onChange={e => setPid(e.target.value)} min="1" />
              </div>
              <div style={{ display:'flex', alignItems:'flex-end' }}>
                <button className="btn btn-outline btn-sm" onClick={lookup} disabled={!addr||lookupLoading}>
                  {lookupLoading ? <span className="spin" /> : 'Look up'}
                </button>
              </div>
            </div>

            {lookupErr && <div className="alert alert-error" style={{ marginBottom:'1rem' }}><span>⚠</span><span>{lookupErr}</span></div>}

            {proposal && (
              <div style={{ border:'1px solid #e7e5e4', borderRadius:10, padding:'1.25rem' }}>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'.875rem' }}>
                  <strong>Proposal #{pid}</strong>
                  <span className={`badge ${proposal.executed ? 'badge-green' : 'badge-orange'}`}>
                    {proposal.executed ? 'Executed' : 'Active'}
                  </span>
                </div>
                <div className="row"><span className="row-lbl">Description</span><span style={{ fontSize:'.85rem' }}>{String(proposal.desc)}</span></div>
                <div className="row"><span className="row-lbl">New Contribution</span><strong>{(Number(proposal.new_contrib as bigint)/1e7).toFixed(2)} XLM/mo</strong></div>
                <div className="row"><span className="row-lbl">Votes For</span><strong style={{ color:'#16a34a' }}>{String(proposal.for_v)}</strong></div>
                <div className="row"><span className="row-lbl">Votes Against</span><strong style={{ color:'#dc2626' }}>{String(proposal.against_v)}</strong></div>

                {total > 0 && (
                  <div style={{ margin:'.875rem 0' }}>
                    <div style={{ display:'flex', justifyContent:'space-between', fontSize:'.75rem', color:'#78716c', marginBottom:'.35rem' }}>
                      <span>For {forPct}%</span><span>Against {100-forPct}%</span>
                    </div>
                    <div className="bar-track"><div className="bar-fill green" style={{ width:`${forPct}%` }} /></div>
                  </div>
                )}

                {!proposal.executed && (
                  <div style={{ display:'flex', gap:'.5rem', marginTop:'.875rem' }}>
                    <button className="btn btn-success" style={{ flex:1 }} onClick={() => vote(true)} disabled={!addr||voting}>
                      {voting ? <span className="spin" /> : '✓ Vote For'}
                    </button>
                    <button className="btn btn-danger" style={{ flex:1 }} onClick={() => vote(false)} disabled={!addr||voting}>
                      {voting ? <span className="spin" /> : '✗ Vote Against'}
                    </button>
                  </div>
                )}
                {!proposal.executed && Number(proposal.for_v as number) > Number(proposal.against_v as number) && Number(proposal.for_v as number) > 0 && (
                  <button className="btn btn-primary btn-full" style={{ marginTop:'.5rem' }} onClick={execute} disabled={!addr||executing}>
                    {executing ? <><span className="spin" /> Executing…</> : 'Execute Proposal'}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {tab === 'create' && (
        <div style={{ maxWidth:560 }}>
          <div className="card">
            <h2 style={{ marginBottom:'.5rem' }}>New Proposal</h2>
            <p style={{ marginBottom:'1.25rem' }}>Propose a change to the pool monthly contribution. Requires CARE tokens.</p>
            {createOk  && <div className="alert alert-success" style={{ marginBottom:'1rem' }}><span>✓</span><span>{createOk}</span></div>}
            {createErr && <div className="alert alert-error"   style={{ marginBottom:'1rem' }}><span>⚠</span><span>{createErr}</span></div>}
            <form onSubmit={create} style={{ display:'flex', flexDirection:'column', gap:'1.25rem' }}>
              <div className="field">
                <label>Description</label>
                <textarea placeholder="Explain the change…" value={desc} onChange={e => setDesc(e.target.value)} required />
              </div>
              <div className="field">
                <label>New Monthly Contribution (XLM)</label>
                <input type="number" placeholder="e.g. 150" value={newContrib} onChange={e => setNewContrib(e.target.value)} min="1" required />
              </div>
              <button type="submit" className="btn btn-primary btn-full" disabled={!addr||creating}>
                {creating ? <><span className="spin" /> Submitting…</> : 'Create Proposal'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

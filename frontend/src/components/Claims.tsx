import { useState, useEffect } from 'react'
import { submitClaim, voteClaim, getClaim, claimCount, isMember } from '../lib/stellar'

type Props = { addr: string | null }

const TYPES = [
  { id: 'hospital', label: 'Hospital', max: 5000 },
  { id: 'surgery',  label: 'Surgery',  max: 10000 },
  { id: 'dental',   label: 'Dental',   max: 2000 },
  { id: 'pharmacy', label: 'Pharmacy', max: 500 },
  { id: 'checkup',  label: 'Checkup',  max: 300 },
  { id: 'other',    label: 'Other',    max: 1000 },
]

export function Claims({ addr }: Props) {
  const [tab, setTab] = useState<'submit'|'vote'>('submit')
  const [memberStatus, setMemberStatus] = useState<boolean | null>(null)

  useEffect(() => {
    if (!addr) return
    isMember(addr).then(setMemberStatus).catch(() => setMemberStatus(null))
  }, [addr])

  const [ctype, setCtype] = useState('hospital')
  const [amount, setAmount] = useState('')
  const [desc, setDesc] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitOk, setSubmitOk] = useState('')
  const [submitErr, setSubmitErr] = useState('')

  const [lookupId, setLookupId] = useState('')
  const [claim, setClaim] = useState<Record<string,unknown>|null>(null)
  const [lookupLoading, setLookupLoading] = useState(false)
  const [lookupErr, setLookupErr] = useState('')
  const [voting, setVoting] = useState(false)
  const [voteOk, setVoteOk] = useState('')
  const [voteErr, setVoteErr] = useState('')

  const maxAmt = TYPES.find(t => t.id === ctype)?.max ?? 1000

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!addr || !amount || !desc) return
    setSubmitting(true); setSubmitOk(''); setSubmitErr('')
    try {
      const stroops = BigInt(Math.round(parseFloat(amount) * 1e7))
      const id = await submitClaim(addr, stroops, desc)
      setSubmitOk(`Claim #${id} submitted on-chain. Needs 2 approvals.`)
      setAmount(''); setDesc('')
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed'
      setSubmitErr(msg)
    }
    finally { setSubmitting(false) }
  }

  async function handleLookup() {
    if (!addr || !lookupId) return
    setLookupLoading(true); setLookupErr(''); setClaim(null)
    try {
      const c = await getClaim(addr, BigInt(lookupId))
      if (!c) { setLookupErr('Claim not found'); return }
      setClaim(c as Record<string,unknown>)
    } catch (e: unknown) { setLookupErr(e instanceof Error ? e.message : 'Not found') }
    finally { setLookupLoading(false) }
  }

  async function handleLatest() {
    if (!addr) return
    const n = await claimCount(addr)
    setLookupId(String(n))
  }

  async function handleVote(approve: boolean) {
    if (!addr || !lookupId) return
    setVoting(true); setVoteOk(''); setVoteErr('')
    try {
      await voteClaim(addr, BigInt(lookupId), approve)
      setVoteOk(`Voted ${approve ? 'For' : 'Against'} claim #${lookupId}.`)
      setClaim(null); setLookupId('')
    } catch (e: unknown) { setVoteErr(e instanceof Error ? e.message : 'Failed') }
    finally { setVoting(false) }
  }

  const statusBadge = (s: unknown) => {
    const st = String(s)
    if (st === 'Approved') return <span className="badge badge-green">Approved</span>
    if (st === 'Rejected') return <span className="badge badge-red">Rejected</span>
    return <span className="badge badge-orange">Pending</span>
  }

  return (
    <div className="page">
      <div style={{ marginBottom:'1.75rem' }}>
        <h1 style={{ marginBottom:'.375rem' }}>Claims</h1>
        <p>Submit a healthcare claim or vote on pending claims. All actions are on-chain.</p>
      </div>
      {!addr && <div className="alert alert-warn" style={{ marginBottom:'1.5rem' }}><span>⚠</span><span>Connect your wallet.</span></div>}
      {addr && memberStatus === false && (
        <div className="alert alert-warn" style={{ marginBottom:'1.5rem' }}>
          <span>⚠</span>
          <span>You are not a pool member yet. Go to <strong>Join Pool</strong> first, then come back to submit claims.</span>
        </div>
      )}

      <div className="tabs">
        <button className={`tab ${tab==='submit'?'on':''}`} onClick={() => setTab('submit')}>Submit Claim</button>
        <button className={`tab ${tab==='vote'?'on':''}`} onClick={() => setTab('vote')}>Vote on Claim</button>
      </div>

      {tab === 'submit' && (
        <div className="grid2">
          <div className="card">
            {submitOk  && <div className="alert alert-success" style={{ marginBottom:'1rem' }}><span>✓</span><span>{submitOk}</span></div>}
            {submitErr && <div className="alert alert-error"   style={{ marginBottom:'1rem' }}><span>⚠</span><span>{submitErr}</span></div>}
            <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:'1.25rem' }}>
              <div className="field">
                <label>Claim Type</label>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'.5rem' }}>
                  {TYPES.map(t => (
                    <button key={t.id} type="button" onClick={() => setCtype(t.id)} style={{
                      padding:'.6rem .5rem', borderRadius:8, fontSize:'.8rem', fontFamily:'inherit', cursor:'pointer',
                      border:`1px solid ${ctype===t.id?'#f97316':'#e7e5e4'}`,
                      background: ctype===t.id?'#fff7ed':'#fff',
                      color: ctype===t.id?'#ea580c':'#44403c',
                      fontWeight: ctype===t.id?600:400, transition:'all .15s',
                    }}>{t.label}</button>
                  ))}
                </div>
              </div>
              <div className="field">
                <label>Amount (XLM) — max {maxAmt.toLocaleString()}</label>
                <input type="number" placeholder={`1 – ${maxAmt}`} value={amount}
                  onChange={e => setAmount(e.target.value)} min="1" max={maxAmt} required />
              </div>
              <div className="field">
                <label>Description</label>
                <textarea placeholder="Describe the medical expense…" value={desc}
                  onChange={e => setDesc(e.target.value)} required />
              </div>
              <button type="submit" className="btn btn-primary btn-full" disabled={!addr || submitting}>
                {submitting ? <><span className="spin" /> Submitting…</> : 'Submit Claim'}
              </button>
            </form>
          </div>

          <div className="card">
            <h2 style={{ marginBottom:'1rem' }}>How it works</h2>
            {[
              ['1','Submit','Recorded on-chain via health_pool::submit_claim()'],
              ['2','Review','2 community members vote via claims_validator::vote()'],
              ['3','Disburse','Approved claims are paid and HEALTH credits are spent'],
            ].map(([n,t,d]) => (
              <div key={n} style={{ display:'flex', gap:'.875rem', marginBottom:'1rem' }}>
                <div style={{ width:28,height:28,borderRadius:'50%',background:'#f97316',color:'#fff',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'.8rem',fontWeight:700,flexShrink:0 }}>{n}</div>
                <div><div style={{ fontWeight:600,fontSize:'.875rem',marginBottom:'.2rem' }}>{t}</div><div style={{ fontSize:'.8rem',color:'#78716c' }}>{d}</div></div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'vote' && (
        <div style={{ maxWidth:560 }}>
          <div className="card">
            <h2 style={{ marginBottom:'1rem' }}>Look up a claim</h2>
            {voteOk  && <div className="alert alert-success" style={{ marginBottom:'1rem' }}><span>✓</span><span>{voteOk}</span></div>}
            {voteErr && <div className="alert alert-error"   style={{ marginBottom:'1rem' }}><span>⚠</span><span>{voteErr}</span></div>}

            <div style={{ display:'flex', gap:'.5rem', marginBottom:'1rem' }}>
              <div className="field" style={{ flex:1 }}>
                <label>Claim ID</label>
                <input type="number" placeholder="e.g. 1" value={lookupId} onChange={e => setLookupId(e.target.value)} min="1" />
              </div>
              <div style={{ display:'flex', flexDirection:'column', justifyContent:'flex-end', gap:'.4rem' }}>
                <button className="btn btn-outline btn-sm" onClick={handleLookup} disabled={!addr || lookupLoading}>
                  {lookupLoading ? <span className="spin" /> : 'Look up'}
                </button>
                <button className="btn btn-ghost btn-sm" onClick={handleLatest} disabled={!addr}>Latest</button>
              </div>
            </div>

            {lookupErr && <div className="alert alert-error" style={{ marginBottom:'1rem' }}><span>⚠</span><span>{lookupErr}</span></div>}

            {claim && (
              <div style={{ border:'1px solid #e7e5e4', borderRadius:10, padding:'1.25rem' }}>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'.875rem' }}>
                  <strong>Claim #{lookupId}</strong>
                  {statusBadge(claim.status)}
                </div>
                <div className="row"><span className="row-lbl">Amount</span><strong>{(Number(claim.amount as bigint)/1e7).toFixed(2)} XLM</strong></div>
                <div className="row"><span className="row-lbl">Votes For</span><strong style={{ color:'#16a34a' }}>{String(claim.for_v)}</strong></div>
                <div className="row"><span className="row-lbl">Votes Against</span><strong style={{ color:'#dc2626' }}>{String(claim.against_v)}</strong></div>
                <div style={{ marginTop:'.75rem', fontSize:'.875rem', color:'#78716c' }}>{String(claim.desc)}</div>
                {String(claim.status) === 'Pending' && (
                  <div style={{ display:'flex', gap:'.5rem', marginTop:'1rem' }}>
                    <button className="btn btn-success" style={{ flex:1 }} onClick={() => handleVote(true)} disabled={!addr||voting}>
                      {voting ? <span className="spin" /> : '✓ Approve'}
                    </button>
                    <button className="btn btn-danger" style={{ flex:1 }} onClick={() => handleVote(false)} disabled={!addr||voting}>
                      {voting ? <span className="spin" /> : '✗ Reject'}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

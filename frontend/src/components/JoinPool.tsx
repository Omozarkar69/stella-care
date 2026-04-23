import { useState } from 'react'
import { joinPool, contribute } from '../lib/stellar'

type Props = { addr: string | null }

export function JoinPool({ addr }: Props) {
  const [loading, setLoading] = useState(false)
  const [ok, setOk] = useState('')
  const [err, setErr] = useState('')

  async function run(fn: () => Promise<unknown>, msg: string) {
    if (!addr) return
    setLoading(true); setOk(''); setErr('')
    try { await fn(); setOk(msg) }
    catch (e: unknown) {
      setErr(e instanceof Error ? e.message : 'Transaction failed')
    }
    finally { setLoading(false) }
  }

  return (
    <div className="page">
      <div style={{ marginBottom:'1.75rem' }}>
        <h1 style={{ marginBottom:'.375rem' }}>Join the Pool</h1>
        <p>Become a member and start building healthcare coverage on Stellar.</p>
      </div>

      {!addr && <div className="alert alert-warn" style={{ marginBottom:'1.5rem' }}><span>⚠</span><span>Connect your wallet first.</span></div>}
      {ok   && <div className="alert alert-success" style={{ marginBottom:'1.5rem' }}><span>✓</span><span>{ok}</span></div>}
      {err  && <div className="alert alert-error"   style={{ marginBottom:'1.5rem' }}><span>⚠</span><span>{err}</span></div>}

      <div className="grid2">
        <div className="card">
          <h2 style={{ marginBottom:'1.25rem' }}>Pool Terms</h2>
          {[
            ['Monthly Contribution', '100 XLM'],
            ['HEALTH Credits on Join', '500 HC'],
            ['CARE Tokens on Join', '100 CARE'],
            ['Max Claim', '10,000 XLM'],
            ['Approval Threshold', '2 votes'],
          ].map(([l, v]) => (
            <div key={l} className="row"><span className="row-lbl">{l}</span><strong>{v}</strong></div>
          ))}
        </div>

        <div style={{ display:'flex', flexDirection:'column', gap:'1rem' }}>
          <div className="card">
            <h2 style={{ marginBottom:'.5rem' }}>New Member</h2>
            <p style={{ marginBottom:'1.25rem' }}>Join for the first time. Calls <code>health_pool::join()</code> on-chain.</p>
            <button className="btn btn-primary btn-full" disabled={!addr || loading}
              onClick={() => run(() => joinPool(addr!), 'Welcome! You received 500 HC and 100 CARE tokens.')}>
              {loading ? <><span className="spin" /> Processing…</> : 'Join Pool — 100 XLM/month'}
            </button>
          </div>

          <div className="card">
            <h2 style={{ marginBottom:'.5rem' }}>Monthly Contribution</h2>
            <p style={{ marginBottom:'1.25rem' }}>Already a member? Pay your monthly contribution to renew coverage.</p>
            <button className="btn btn-outline btn-full" disabled={!addr || loading}
              onClick={() => run(() => contribute(addr!), 'Contribution recorded. +500 HC and +10 CARE earned.')}>
              {loading ? <><span className="spin" /> Processing…</> : 'Pay Monthly Contribution'}
            </button>
          </div>

          <div className="card" style={{ background:'#fafaf9' }}>
            <div style={{ fontSize:'.72rem', color:'#a8a29e', fontWeight:600, letterSpacing:'.04em', textTransform:'uppercase', marginBottom:'.375rem' }}>Pool Contract</div>
            <div style={{ fontFamily:'monospace', fontSize:'.72rem', color:'#78716c', wordBreak:'break-all' }}>
              {import.meta.env.VITE_POOL}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

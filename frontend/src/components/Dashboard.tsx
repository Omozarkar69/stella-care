import { useEffect, useState } from 'react'
import { memberCount, totalFunds, careBalance, hcCredits, isMember, getMember } from '../lib/stellar'

type Props = { addr: string | null }

export function Dashboard({ addr }: Props) {
  const [data, setData] = useState<{ members: number; funds: bigint; care: bigint; hc: bigint; rep: number; member: boolean } | null>(null)
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')

  useEffect(() => {
    if (!addr) return
    setLoading(true); setErr('')
    Promise.all([memberCount(addr), totalFunds(addr), careBalance(addr), hcCredits(addr), isMember(addr)])
      .then(async ([members, funds, care, hc, member]) => {
        let rep = 0
        if (member) {
          const info = await getMember(addr) as { reputation?: number } | null
          rep = info?.reputation ?? 0
        }
        setData({ members, funds, care, hc, rep, member })
      })
      .catch(e => setErr(e.message))
      .finally(() => setLoading(false))
  }, [addr])

  const fmt = (n: bigint) => (Number(n) / 1e7).toFixed(2)

  return (
    <div className="page">
      <div style={{ marginBottom: '1.75rem' }}>
        <h1 style={{ marginBottom: '.375rem' }}>Pool Overview</h1>
        <p>Live data from StellarCare smart contracts on Testnet.</p>
      </div>

      {!addr && <div className="alert alert-info" style={{ marginBottom: '1.5rem' }}><span>ℹ</span><span>Connect your Freighter wallet to see your stats.</span></div>}
      {err   && <div className="alert alert-error" style={{ marginBottom: '1.5rem' }}><span>⚠</span><span>{err}</span></div>}

      <div className="stats">
        <Stat icon="👥" val={loading ? '—' : String(data?.members ?? '—')} lbl="Active Members" />
        <Stat icon="💰" val={loading ? '—' : data ? `${fmt(data.funds)} XLM` : '—'} lbl="Pool Funds" />
        <Stat icon="🗳" val={loading ? '—' : data ? `${fmt(data.care)} CARE` : '—'} lbl="Your CARE Tokens" />
        <Stat icon="🏥" val={loading ? '—' : data ? `${fmt(data.hc)} HC` : '—'} lbl="Your Health Credits" />
      </div>

      {loading && <div style={{ display:'flex', alignItems:'center', gap:'.75rem', color:'#78716c', fontSize:'.875rem' }}><span className="spin" />Loading on-chain data…</div>}

      {data && addr && (
        <div className="grid2">
          <div className="card">
            <h2 style={{ marginBottom:'1rem' }}>Membership</h2>
            <div className="row"><span className="row-lbl">Status</span>
              {data.member ? <span className="badge badge-green">Active</span> : <span className="badge badge-gray">Not a member</span>}
            </div>
            <div className="row"><span className="row-lbl">Reputation</span><strong>{data.rep} / 1000</strong></div>
            <div style={{ marginTop:'.75rem' }}>
              <div className="bar-track"><div className="bar-fill" style={{ width:`${(data.rep/1000)*100}%` }} /></div>
            </div>
          </div>
          <div className="card">
            <h2 style={{ marginBottom:'1rem' }}>Coverage</h2>
            <div className="row"><span className="row-lbl">Health Credits</span><strong style={{ color:'#9333ea' }}>{fmt(data.hc)} HC</strong></div>
            <div className="row"><span className="row-lbl">Coverage Value</span><strong>{fmt(data.hc)} XLM</strong></div>
            <div className="row"><span className="row-lbl">CARE Tokens</span><strong style={{ color:'#2563eb' }}>{fmt(data.care)} CARE</strong></div>
          </div>
        </div>
      )}
    </div>
  )
}

function Stat({ icon, val, lbl }: { icon: string; val: string; lbl: string }) {
  return (
    <div className="stat">
      <div className="stat-icon">{icon}</div>
      <div className="stat-val">{val}</div>
      <div className="stat-lbl">{lbl}</div>
    </div>
  )
}

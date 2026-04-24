import { useState, useEffect, useCallback } from 'react'
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

type ClaimRow = { id: number; data: Record<string, unknown> }

function statusBadge(s: unknown) {
  const st = String(s)
  if (st === 'Approved') return <span className="badge badge-green">Approved</span>
  if (st === 'Rejected') return <span className="badge badge-red">Rejected</span>
  return <span className="badge badge-orange">Pending</span>
}

export function Claims({ addr }: Props) {
  const [tab, setTab] = useState<'submit' | 'list'>('list')
  const [memberStatus, setMemberStatus] = useState<boolean | null>(null)

  // ── submit state ──────────────────────────────────────────────────────────
  const [ctype, setCtype] = useState('hospital')
  const [amount, setAmount] = useState('')
  const [desc, setDesc] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitOk, setSubmitOk] = useState('')
  const [submitErr, setSubmitErr] = useState('')

  // ── list state ────────────────────────────────────────────────────────────
  const [claims, setClaims] = useState<ClaimRow[]>([])
  const [listLoading, setListLoading] = useState(false)
  const [listErr, setListErr] = useState('')
  const [expanded, setExpanded] = useState<number | null>(null)

  // ── vote state ────────────────────────────────────────────────────────────
  const [voting, setVoting] = useState(false)
  const [voteOk, setVoteOk] = useState('')
  const [voteErr, setVoteErr] = useState('')

  useEffect(() => {
    if (!addr) return
    isMember(addr).then(setMemberStatus).catch(() => setMemberStatus(null))
  }, [addr])

  const loadClaims = useCallback(async () => {
    if (!addr) return
    setListLoading(true); setListErr(''); setClaims([])
    try {
      const total = Number(await claimCount(addr))
      if (total === 0) { setListLoading(false); return }
      const rows: ClaimRow[] = []
      // load all claims in parallel
      await Promise.all(
        Array.from({ length: total }, (_, i) => i + 1).map(async id => {
          try {
            const c = await getClaim(addr, BigInt(id))
            if (c) rows.push({ id, data: c as Record<string, unknown> })
          } catch { /* skip failed */ }
        })
      )
      rows.sort((a, b) => a.id - b.id)
      setClaims(rows)
    } catch (e: unknown) {
      setListErr(e instanceof Error ? e.message : 'Failed to load claims')
    } finally {
      setListLoading(false)
    }
  }, [addr])

  useEffect(() => {
    if (tab === 'list' && addr) loadClaims()
  }, [tab, addr, loadClaims])

  const maxAmt = TYPES.find(t => t.id === ctype)?.max ?? 1000

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!addr || !amount || !desc) return
    setSubmitting(true); setSubmitOk(''); setSubmitErr('')
    try {
      const stroops = BigInt(Math.round(parseFloat(amount) * 1e7))
      const id = await submitClaim(addr, stroops, desc)
      setSubmitOk(`Claim #${id} submitted! Share this ID so others can vote on it.`)
      setAmount(''); setDesc('')
      // refresh list after submit
      loadClaims()
    } catch (e: unknown) {
      setSubmitErr(e instanceof Error ? e.message : 'Failed')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleVote(claimId: number, approve: boolean) {
    if (!addr) return
    setVoting(true); setVoteOk(''); setVoteErr('')
    try {
      await voteClaim(addr, BigInt(claimId), approve)
      setVoteOk(`Voted ${approve ? 'For ✓' : 'Against ✗'} claim #${claimId}.`)
      setExpanded(null)
      loadClaims()
    } catch (e: unknown) {
      setVoteErr(e instanceof Error ? e.message : 'Failed')
    } finally {
      setVoting(false)
    }
  }

  return (
    <div className="page">
      <div style={{ marginBottom: '1.75rem' }}>
        <h1 style={{ marginBottom: '.375rem' }}>Claims</h1>
        <p>Browse all on-chain claims, vote on pending ones, or submit a new claim.</p>
      </div>

      {!addr && <div className="alert alert-warn" style={{ marginBottom: '1.5rem' }}><span>⚠</span><span>Connect your wallet.</span></div>}
      {addr && memberStatus === false && (
        <div className="alert alert-warn" style={{ marginBottom: '1.5rem' }}>
          <span>⚠</span><span>You are not a pool member yet. Go to <strong>Join Pool</strong> first.</span>
        </div>
      )}

      <div className="tabs">
        <button className={`tab ${tab === 'list' ? 'on' : ''}`} onClick={() => setTab('list')}>All Claims</button>
        <button className={`tab ${tab === 'submit' ? 'on' : ''}`} onClick={() => setTab('submit')}>Submit Claim</button>
      </div>

      {/* ── ALL CLAIMS LIST ── */}
      {tab === 'list' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <span style={{ fontSize: '.875rem', color: '#78716c' }}>
              {listLoading ? 'Loading…' : `${claims.length} claim${claims.length !== 1 ? 's' : ''} on-chain`}
            </span>
            <button className="btn btn-outline btn-sm" onClick={loadClaims} disabled={!addr || listLoading}>
              {listLoading ? <span className="spin" /> : '↻ Refresh'}
            </button>
          </div>

          {voteOk && <div className="alert alert-success" style={{ marginBottom: '1rem' }}><span>✓</span><span>{voteOk}</span></div>}
          {voteErr && <div className="alert alert-error" style={{ marginBottom: '1rem' }}><span>⚠</span><span>{voteErr}</span></div>}
          {listErr && <div className="alert alert-error" style={{ marginBottom: '1rem' }}><span>⚠</span><span>{listErr}</span></div>}

          {listLoading && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem', color: '#78716c', fontSize: '.875rem', padding: '2rem 0' }}>
              <span className="spin" />Loading claims from chain…
            </div>
          )}

          {!listLoading && claims.length === 0 && !listErr && (
            <div className="card" style={{ textAlign: 'center', padding: '2.5rem', color: '#78716c' }}>
              <div style={{ fontSize: '2rem', marginBottom: '.75rem' }}>📋</div>
              <div style={{ fontWeight: 600, marginBottom: '.25rem' }}>No claims yet</div>
              <div style={{ fontSize: '.875rem' }}>Be the first to submit a claim.</div>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '.75rem' }}>
            {claims.map(({ id, data }) => {
              const isOpen = expanded === id
              const status = String(data.status)
              const isPending = status === 'Pending'
              return (
                <div key={id} className="card" style={{ padding: '1rem 1.25rem' }}>
                  {/* header row */}
                  <div
                    style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', gap: '1rem' }}
                    onClick={() => setExpanded(isOpen ? null : id)}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem', minWidth: 0 }}>
                      <span style={{
                        background: '#f97316', color: '#fff', borderRadius: 6,
                        padding: '.15rem .5rem', fontSize: '.75rem', fontWeight: 700, flexShrink: 0,
                      }}>#{id}</span>
                      <span style={{ fontSize: '.875rem', color: '#44403c', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {String(data.desc)}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', flexShrink: 0 }}>
                      {statusBadge(data.status)}
                      <span style={{ fontSize: '.75rem', color: '#a8a29e' }}>{isOpen ? '▲' : '▼'}</span>
                    </div>
                  </div>

                  {/* expanded detail */}
                  {isOpen && (
                    <div style={{ marginTop: '1rem', borderTop: '1px solid #f5f5f4', paddingTop: '1rem' }}>
                      <div className="row"><span className="row-lbl">Amount</span><strong>{(Number(data.amount as bigint) / 1e7).toFixed(2)} XLM</strong></div>
                      <div className="row">
                        <span className="row-lbl">Votes</span>
                        <span>
                          <strong style={{ color: '#16a34a' }}>{String(data.for_v)} For</strong>
                          {' · '}
                          <strong style={{ color: '#dc2626' }}>{String(data.against_v)} Against</strong>
                        </span>
                      </div>
                      <div style={{ marginTop: '.75rem', fontSize: '.875rem', color: '#78716c' }}>{String(data.desc)}</div>

                      {isPending && addr && (
                        <div style={{ display: 'flex', gap: '.5rem', marginTop: '1rem' }}>
                          <button className="btn btn-success" style={{ flex: 1 }} onClick={() => handleVote(id, true)} disabled={voting}>
                            {voting ? <span className="spin" /> : '✓ Approve'}
                          </button>
                          <button className="btn btn-danger" style={{ flex: 1 }} onClick={() => handleVote(id, false)} disabled={voting}>
                            {voting ? <span className="spin" /> : '✗ Reject'}
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── SUBMIT CLAIM ── */}
      {tab === 'submit' && (
        <div className="grid2">
          <div className="card">
            {submitOk && (
              <div className="alert alert-success" style={{ marginBottom: '1rem' }}>
                <span>✓</span>
                <div>
                  <div style={{ fontWeight: 600 }}>{submitOk}</div>
                  <div style={{ fontSize: '.8rem', marginTop: '.25rem', opacity: .8 }}>
                    Go to "All Claims" to see it in the list.
                  </div>
                </div>
              </div>
            )}
            {submitErr && <div className="alert alert-error" style={{ marginBottom: '1rem' }}><span>⚠</span><span>{submitErr}</span></div>}
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div className="field">
                <label>Claim Type</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '.5rem' }}>
                  {TYPES.map(t => (
                    <button key={t.id} type="button" onClick={() => setCtype(t.id)} style={{
                      padding: '.6rem .5rem', borderRadius: 8, fontSize: '.8rem', fontFamily: 'inherit', cursor: 'pointer',
                      border: `1px solid ${ctype === t.id ? '#f97316' : '#e7e5e4'}`,
                      background: ctype === t.id ? '#fff7ed' : '#fff',
                      color: ctype === t.id ? '#ea580c' : '#44403c',
                      fontWeight: ctype === t.id ? 600 : 400, transition: 'all .15s',
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
            <h2 style={{ marginBottom: '1rem' }}>How it works</h2>
            {[
              ['1', 'Submit', 'Recorded on-chain via health_pool::submit_claim()'],
              ['2', 'Review', '2 community members vote via claims_validator::vote()'],
              ['3', 'Disburse', 'Approved claims are paid and HEALTH credits are spent'],
            ].map(([n, t, d]) => (
              <div key={n} style={{ display: 'flex', gap: '.875rem', marginBottom: '1rem' }}>
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#f97316', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '.8rem', fontWeight: 700, flexShrink: 0 }}>{n}</div>
                <div><div style={{ fontWeight: 600, fontSize: '.875rem', marginBottom: '.2rem' }}>{t}</div><div style={{ fontSize: '.8rem', color: '#78716c' }}>{d}</div></div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

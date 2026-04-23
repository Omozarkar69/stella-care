import { useState } from 'react'
import type { Page } from '../App'
import type { useFreighter } from '../hooks/useFreighter'

type Props = { page: Page; setPage: (p: Page) => void; freighter: ReturnType<typeof useFreighter> }

const LINKS: { id: Page; label: string }[] = [
  { id: 'dashboard',  label: 'Overview' },
  { id: 'join',       label: 'Join Pool' },
  { id: 'claims',     label: 'Claims' },
  { id: 'governance', label: 'Governance' },
]

function HamburgerIcon({ open }: { open: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
      {open ? (
        <>
          <line x1="4" y1="4" x2="18" y2="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          <line x1="18" y1="4" x2="4" y2="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </>
      ) : (
        <>
          <line x1="3" y1="6"  x2="19" y2="6"  stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          <line x1="3" y1="11" x2="19" y2="11" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          <line x1="3" y1="16" x2="19" y2="16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </>
      )}
    </svg>
  )
}

export function Nav({ page, setPage, freighter }: Props) {
  const [walletOpen, setWalletOpen] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const { wallet, connect, disconnect, short } = freighter

  function navigate(p: Page) {
    setPage(p)
    setMobileOpen(false)
  }

  return (
    <>
      {/* Wallet dropdown backdrop */}
      {walletOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 90 }} onClick={() => setWalletOpen(false)} />
      )}

      <header style={{ background: '#fff', borderBottom: '1px solid #e7e5e4', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ maxWidth: 1080, margin: '0 auto', padding: '0 1.25rem', height: 58, display: 'flex', alignItems: 'center', gap: '1rem' }}>

          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', fontWeight: 700, fontSize: '1rem', flexShrink: 0 }}>
            <div style={{ width: 30, height: 30, background: '#f97316', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '.9rem' }}>🏥</div>
            StellarCare
          </div>

          {/* Desktop nav links */}
          <nav className="nav-desktop-links" style={{ display: 'flex', gap: '.15rem', flex: 1 }}>
            {LINKS.map(l => (
              <button key={l.id} onClick={() => navigate(l.id)} style={{
                padding: '.4rem .875rem', borderRadius: 8, border: 'none',
                background: page === l.id ? '#fff7ed' : 'transparent',
                color: page === l.id ? '#ea580c' : '#78716c',
                fontWeight: page === l.id ? 600 : 500,
                fontSize: '.875rem', cursor: 'pointer', fontFamily: 'inherit', transition: 'all .15s',
              }}>{l.label}</button>
            ))}
          </nav>

          <div style={{ flex: 1 }} className="nav-desktop-links" />

          {/* Wallet — desktop */}
          <div style={{ flexShrink: 0, position: 'relative' }} className="nav-desktop-links">
            <WalletWidget wallet={wallet} connect={connect} disconnect={disconnect} short={short}
              open={walletOpen} setOpen={setWalletOpen} />
          </div>

          {/* Mobile: wallet connect + hamburger */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', marginLeft: 'auto' }} className="nav-mobile-toggle" aria-hidden="false">
            {(wallet.status === 'idle' || wallet.status === 'error') && (
              <button className="btn btn-primary btn-sm" onClick={connect} style={{ fontSize: '.75rem', padding: '.3rem .65rem' }}>Connect</button>
            )}
            {wallet.status === 'connected' && (
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#16a34a' }} title="Wallet connected" />
            )}
            <button
              className="nav-mobile-toggle"
              onClick={() => setMobileOpen(o => !o)}
              aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
              style={{ display: 'flex' }}
            >
              <HamburgerIcon open={mobileOpen} />
            </button>
          </div>
        </div>

        {/* Wrong network banner */}
        {wallet.status === 'connected' && wallet.network !== 'TESTNET' && (
          <div style={{ background: '#fff7ed', borderTop: '1px solid #fed7aa', padding: '.4rem 1.25rem', fontSize: '.8rem', color: '#9a3412', textAlign: 'center' }}>
            Switch Freighter to <strong>Testnet</strong> to use StellarCare.
          </div>
        )}
      </header>

      {/* Mobile drawer */}
      <div className={`nav-mobile-drawer ${mobileOpen ? 'open' : ''}`}>
        {LINKS.map(l => (
          <button key={l.id} className={`nav-mobile-link ${page === l.id ? 'on' : ''}`} onClick={() => navigate(l.id)}>
            {l.label}
          </button>
        ))}
        <div className="nav-mobile-wallet">
          <WalletWidget wallet={wallet} connect={connect} disconnect={disconnect} short={short}
            open={walletOpen} setOpen={setWalletOpen} mobile />
        </div>
      </div>
    </>
  )
}

// ── Wallet widget (shared desktop + mobile) ───────────────────────────────────

type WalletProps = {
  wallet: ReturnType<typeof useFreighter>['wallet']
  connect: () => void
  disconnect: () => void
  short: string | null
  open: boolean
  setOpen: (v: boolean | ((p: boolean) => boolean)) => void
  mobile?: boolean
}

function WalletWidget({ wallet, connect, disconnect, short, open, setOpen, mobile }: WalletProps) {
  if (wallet.status === 'checking') {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', fontSize: '.875rem', color: '#78716c' }}>
        <span className="spin" />Connecting…
      </div>
    )
  }
  if (wallet.status === 'not_installed') {
    return (
      <a href="https://www.freighter.app/" target="_blank" rel="noreferrer"
        className="btn btn-primary btn-sm" style={mobile ? { display: 'block', textAlign: 'center' } : {}}>
        Install Freighter
      </a>
    )
  }
  if (wallet.status === 'idle' || wallet.status === 'error') {
    return (
      <button className="btn btn-primary btn-sm" onClick={connect}
        style={mobile ? { width: '100%' } : {}}>
        Connect Wallet
      </button>
    )
  }
  // connected
  return (
    <div style={{ position: 'relative' }}>
      <button onClick={() => setOpen(o => !o)} style={{
        display: 'flex', alignItems: 'center', gap: '.5rem',
        padding: '.38rem .75rem', background: '#f5f5f4', border: '1px solid #e7e5e4',
        borderRadius: 8, cursor: 'pointer', fontSize: '.8rem', fontFamily: 'inherit',
        color: '#44403c', fontWeight: 500, width: mobile ? '100%' : undefined,
        justifyContent: mobile ? 'space-between' : undefined,
      }}>
        <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#16a34a', flexShrink: 0 }} />
        <span style={{ fontFamily: 'monospace' }}>{short}</span>
        <span style={{ fontSize: '.65rem', color: '#a8a29e' }}>▾</span>
      </button>
      {open && (
        <div style={{
          position: mobile ? 'static' : 'absolute',
          right: 0, top: 'calc(100% + 8px)',
          background: '#fff', border: '1px solid #e7e5e4', borderRadius: 12,
          padding: '.5rem', minWidth: 230,
          boxShadow: mobile ? 'none' : '0 8px 24px rgba(0,0,0,.1)',
          zIndex: 200, marginTop: mobile ? '.5rem' : undefined,
        }}>
          <div style={{ padding: '.5rem .75rem .75rem', borderBottom: '1px solid #f5f5f4', marginBottom: '.375rem' }}>
            <div style={{ fontSize: '.7rem', color: '#a8a29e', fontWeight: 600, letterSpacing: '.04em', textTransform: 'uppercase', marginBottom: '.25rem' }}>Connected</div>
            <div style={{ fontFamily: 'monospace', fontSize: '.72rem', color: '#44403c', wordBreak: 'break-all' }}>
              {wallet.status === 'connected' ? wallet.address : ''}
            </div>
            <div style={{ marginTop: '.3rem', fontSize: '.75rem', color: '#78716c' }}>
              Network: <span style={{ color: '#16a34a', fontWeight: 600 }}>
                {wallet.status === 'connected' ? wallet.network : ''}
              </span>
            </div>
          </div>
          <button
            onClick={() => { if (wallet.status === 'connected') navigator.clipboard.writeText(wallet.address); setOpen(false) }}
            style={{ display: 'block', width: '100%', padding: '.5rem .75rem', background: 'transparent', border: 'none', borderRadius: 6, fontSize: '.85rem', cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit', color: '#44403c' }}>
            Copy address
          </button>
          <button
            onClick={() => { disconnect(); setOpen(false) }}
            style={{ display: 'block', width: '100%', padding: '.5rem .75rem', background: 'transparent', border: 'none', borderRadius: 6, fontSize: '.85rem', cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit', color: '#dc2626' }}>
            Disconnect
          </button>
        </div>
      )}
    </div>
  )
}

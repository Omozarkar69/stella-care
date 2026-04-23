export function Landing({ onGetStarted }: { onGetStarted: () => void }) {
  return (
    <div>
      {/* Hero */}
      <section style={{
        background: 'linear-gradient(135deg, #fff7ed 0%, #fef3c7 50%, #ecfdf5 100%)',
        padding: '5rem 1.25rem 4rem',
        textAlign: 'center',
        borderBottom: '1px solid #e7e5e4',
      }}>
        <div style={{ maxWidth: 720, margin: '0 auto' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '.5rem',
            background: '#fff', border: '1px solid #fed7aa', borderRadius: 999,
            padding: '.3rem .9rem', fontSize: '.78rem', fontWeight: 600,
            color: '#ea580c', marginBottom: '1.5rem',
          }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#16a34a', display: 'inline-block' }} />
            Live on Stellar Testnet
          </div>
          <h1 style={{
            fontSize: 'clamp(2rem, 5vw, 3.25rem)', fontWeight: 800,
            letterSpacing: '-.03em', lineHeight: 1.15, marginBottom: '1.25rem',
            color: '#1c1917',
          }}>
            Decentralized Healthcare<br />
            <span style={{ color: '#f97316' }}>Coverage for Everyone</span>
          </h1>
          <p style={{
            fontSize: 'clamp(.95rem, 2vw, 1.15rem)', color: '#57534e',
            maxWidth: 560, margin: '0 auto 2.25rem', lineHeight: 1.7,
          }}>
            StellarCare is a community-owned health insurance pool built on the Stellar blockchain.
            Contribute monthly, earn CARE tokens, and get coverage — no middlemen, no hidden fees.
          </p>
          <div style={{ display: 'flex', gap: '.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button className="btn btn-primary" style={{ fontSize: '1rem', padding: '.75rem 2rem' }} onClick={onGetStarted}>
              Get Started →
            </button>
            <a href="https://github.com" target="_blank" rel="noreferrer"
              className="btn btn-outline" style={{ fontSize: '1rem', padding: '.75rem 2rem' }}>
              View on GitHub
            </a>
          </div>
          <p style={{ marginTop: '1.25rem', fontSize: '.8rem', color: '#a8a29e' }}>
            No KYC required · Open source · Community governed
          </p>
        </div>
      </section>

      {/* Stats bar */}
      <section style={{ background: '#fff', borderBottom: '1px solid #e7e5e4', padding: '1.75rem 1.25rem' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1.5rem', textAlign: 'center' }}>
          {[
            { val: '2,400+', lbl: 'Pool Members' },
            { val: '$1.2M', lbl: 'Total Funds Locked' },
            { val: '340', lbl: 'Claims Processed' },
            { val: '99.2%', lbl: 'Uptime' },
          ].map(s => (
            <div key={s.lbl}>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#f97316', letterSpacing: '-.03em' }}>{s.val}</div>
              <div style={{ fontSize: '.8rem', color: '#78716c', fontWeight: 500, marginTop: '.2rem' }}>{s.lbl}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section style={{ padding: '4rem 1.25rem', background: '#fafaf9' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <h2 style={{ fontSize: '1.85rem', fontWeight: 800, letterSpacing: '-.02em', marginBottom: '.6rem' }}>
              Why StellarCare?
            </h2>
            <p style={{ color: '#78716c', maxWidth: 480, margin: '0 auto' }}>
              Traditional health insurance is opaque and expensive. We built something better.
            </p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.5rem' }}>
            {FEATURES.map(f => (
              <div key={f.title} className="card" style={{ padding: '1.75rem' }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 12, background: f.bg,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '1.25rem', marginBottom: '1rem',
                }}>{f.icon}</div>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '.4rem' }}>{f.title}</h3>
                <p style={{ fontSize: '.875rem', color: '#78716c', lineHeight: 1.6 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section style={{ padding: '4rem 1.25rem', background: '#fff', borderTop: '1px solid #e7e5e4' }}>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <h2 style={{ fontSize: '1.85rem', fontWeight: 800, letterSpacing: '-.02em', marginBottom: '.6rem' }}>
              How It Works
            </h2>
            <p style={{ color: '#78716c' }}>Four simple steps to get covered.</p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {STEPS.map((s, i) => (
              <div key={s.title} style={{ display: 'flex', gap: '1.25rem', alignItems: 'flex-start' }}>
                <div style={{
                  width: 40, height: 40, borderRadius: '50%', background: '#f97316',
                  color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 800, fontSize: '.95rem', flexShrink: 0,
                }}>{i + 1}</div>
                <div>
                  <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '.3rem' }}>{s.title}</h3>
                  <p style={{ fontSize: '.875rem', color: '#78716c', lineHeight: 1.6 }}>{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section style={{ padding: '4rem 1.25rem', background: '#fafaf9', borderTop: '1px solid #e7e5e4' }}>
        <div style={{ maxWidth: 720, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <h2 style={{ fontSize: '1.85rem', fontWeight: 800, letterSpacing: '-.02em', marginBottom: '.6rem' }}>
              Frequently Asked Questions
            </h2>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {FAQS.map(f => (
              <FaqItem key={f.q} q={f.q} a={f.a} />
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{
        padding: '4rem 1.25rem',
        background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
        textAlign: 'center',
      }}>
        <div style={{ maxWidth: 560, margin: '0 auto' }}>
          <h2 style={{ fontSize: '2rem', fontWeight: 800, color: '#fff', marginBottom: '.75rem', letterSpacing: '-.02em' }}>
            Ready to get covered?
          </h2>
          <p style={{ color: 'rgba(255,255,255,.85)', marginBottom: '2rem', fontSize: '1rem' }}>
            Join thousands of members already protected by StellarCare. Connect your Freighter wallet and join in under a minute.
          </p>
          <button className="btn" onClick={onGetStarted} style={{
            background: '#fff', color: '#ea580c', fontSize: '1rem',
            padding: '.75rem 2.25rem', fontWeight: 700,
          }}>
            Join the Pool →
          </button>
        </div>
      </section>

      <Footer />
    </div>
  )
}

function FaqItem({ q, a }: { q: string; a: string }) {
  return (
    <div className="card" style={{ padding: '1.25rem 1.5rem' }}>
      <div style={{ fontWeight: 700, fontSize: '.95rem', marginBottom: '.5rem', color: '#1c1917' }}>{q}</div>
      <p style={{ fontSize: '.875rem', color: '#78716c', lineHeight: 1.65, margin: 0 }}>{a}</p>
    </div>
  )
}

export function Footer() {
  return (
    <footer style={{
      background: '#1c1917', color: '#a8a29e',
      padding: '3rem 1.25rem 2rem',
      borderTop: '1px solid #292524',
    }}>
      <div style={{ maxWidth: 1080, margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '2rem', marginBottom: '2.5rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', fontWeight: 700, fontSize: '1rem', color: '#fff', marginBottom: '.75rem' }}>
              <div style={{ width: 28, height: 28, background: '#f97316', borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '.85rem' }}>🏥</div>
              StellarCare
            </div>
            <p style={{ fontSize: '.8rem', lineHeight: 1.65, color: '#78716c' }}>
              Decentralized health coverage powered by the Stellar blockchain.
            </p>
          </div>
          <div>
            <div style={{ fontWeight: 600, fontSize: '.8rem', color: '#e7e5e4', marginBottom: '.75rem', textTransform: 'uppercase', letterSpacing: '.06em' }}>Product</div>
            {['Overview', 'Join Pool', 'Claims', 'Governance'].map(l => (
              <div key={l} style={{ fontSize: '.85rem', marginBottom: '.4rem' }}>{l}</div>
            ))}
          </div>
          <div>
            <div style={{ fontWeight: 600, fontSize: '.8rem', color: '#e7e5e4', marginBottom: '.75rem', textTransform: 'uppercase', letterSpacing: '.06em' }}>Resources</div>
            {['Documentation', 'Smart Contracts', 'GitHub', 'Stellar Network'].map(l => (
              <div key={l} style={{ fontSize: '.85rem', marginBottom: '.4rem' }}>{l}</div>
            ))}
          </div>
          <div>
            <div style={{ fontWeight: 600, fontSize: '.8rem', color: '#e7e5e4', marginBottom: '.75rem', textTransform: 'uppercase', letterSpacing: '.06em' }}>Company</div>
            {['About Us', 'Blog', 'Contact', 'Privacy Policy'].map(l => (
              <div key={l} style={{ fontSize: '.85rem', marginBottom: '.4rem' }}>{l}</div>
            ))}
          </div>
        </div>
        <div style={{ borderTop: '1px solid #292524', paddingTop: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '.75rem' }}>
          <div style={{ fontSize: '.78rem' }}>© 2025 StellarCare. Open source under MIT License.</div>
          <div style={{ fontSize: '.78rem' }}>Built on <span style={{ color: '#f97316' }}>Stellar</span> · Testnet</div>
        </div>
      </div>
    </footer>
  )
}

const FEATURES = [
  { icon: '🔗', bg: '#fff7ed', title: 'Fully On-Chain', desc: 'Every contribution, claim, and vote is recorded on the Stellar blockchain. No central server, no single point of failure.' },
  { icon: '🗳️', bg: '#eff6ff', title: 'Community Governed', desc: 'CARE token holders vote on pool parameters. Propose changes, vote, and execute — all transparently on-chain.' },
  { icon: '⚡', bg: '#f0fdf4', title: 'Instant Settlements', desc: 'Approved claims are disbursed in seconds, not weeks. Stellar\'s 5-second finality means you get paid fast.' },
  { icon: '🔒', bg: '#fdf4ff', title: 'Non-Custodial', desc: 'Your wallet, your keys. StellarCare never holds your funds — the smart contract does, governed by the community.' },
  { icon: '💎', bg: '#fff7ed', title: 'Earn While Covered', desc: 'Every contribution earns you CARE tokens and Health Credits. Active members build reputation and unlock higher coverage.' },
  { icon: '🌍', bg: '#f0fdf4', title: 'Borderless Access', desc: 'Anyone with a Stellar wallet can join. No geographic restrictions, no credit checks, no paperwork.' },
]

const STEPS = [
  { title: 'Connect your Freighter wallet', desc: 'Install the Freighter browser extension and connect it to StellarCare. Make sure you\'re on Testnet.' },
  { title: 'Join the pool', desc: 'Pay the monthly contribution of 100 XLM. You\'ll instantly receive 500 Health Credits and 100 CARE tokens.' },
  { title: 'Stay covered with monthly contributions', desc: 'Pay your monthly contribution to keep your coverage active and earn additional CARE tokens and Health Credits.' },
  { title: 'Submit claims when you need them', desc: 'Submit a healthcare claim on-chain. Two community members review and vote. Approved claims are paid out automatically.' },
]

const FAQS = [
  { q: 'What is StellarCare?', a: 'StellarCare is a decentralized health insurance pool built on the Stellar blockchain. Members contribute monthly, and the pooled funds are used to pay approved healthcare claims.' },
  { q: 'How are claims approved?', a: 'Claims go through a community voting process. Two pool members must vote to approve a claim before it is disbursed. All votes are recorded on-chain and fully transparent.' },
  { q: 'What are CARE tokens?', a: 'CARE tokens are governance tokens earned by contributing to the pool. They give you voting rights on proposals that change pool parameters like the monthly contribution amount.' },
  { q: 'What are Health Credits (HC)?', a: 'Health Credits represent your coverage balance. Each HC is worth 1 XLM of coverage. You earn HC when you join and with each monthly contribution.' },
  { q: 'Is this on mainnet?', a: 'StellarCare is currently running on Stellar Testnet. Mainnet launch is planned after a full security audit and community governance vote.' },
  { q: 'Do I need to pass KYC?', a: 'No. StellarCare is permissionless — anyone with a Stellar wallet can join. We believe healthcare access should not require identity verification.' },
]

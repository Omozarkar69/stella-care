import { Footer } from './Landing'

export function About() {
  return (
    <div>
      {/* Hero */}
      <section style={{
        background: 'linear-gradient(135deg, #fff7ed 0%, #fef9f0 100%)',
        padding: '4rem 1.25rem 3.5rem',
        borderBottom: '1px solid #e7e5e4',
        textAlign: 'center',
      }}>
        <div style={{ maxWidth: 640, margin: '0 auto' }}>
          <h1 style={{ fontSize: 'clamp(1.75rem, 4vw, 2.75rem)', fontWeight: 800, letterSpacing: '-.03em', marginBottom: '.75rem' }}>
            About StellarCare
          </h1>
          <p style={{ fontSize: '1.05rem', color: '#57534e', lineHeight: 1.7 }}>
            We're a small team of engineers and healthcare advocates who believe access to coverage
            shouldn't depend on where you live, who you work for, or how much you earn.
          </p>
        </div>
      </section>

      {/* Mission */}
      <section style={{ padding: '4rem 1.25rem', background: '#fff' }}>
        <div style={{ maxWidth: 860, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '3rem', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: '.78rem', fontWeight: 700, color: '#f97316', letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: '.75rem' }}>Our Mission</div>
            <h2 style={{ fontSize: '1.65rem', fontWeight: 800, letterSpacing: '-.02em', marginBottom: '1rem', lineHeight: 1.25 }}>
              Healthcare coverage that belongs to the community
            </h2>
            <p style={{ color: '#57534e', lineHeight: 1.75, marginBottom: '1rem', fontSize: '.95rem' }}>
              Traditional health insurance is a black box. Premiums go up, coverage goes down, and
              claims get denied with no explanation. We built StellarCare to flip that model on its head.
            </p>
            <p style={{ color: '#57534e', lineHeight: 1.75, fontSize: '.95rem' }}>
              Every dollar in the pool is visible on-chain. Every claim decision is voted on by the
              community. Every rule change goes through governance. No surprises, no fine print.
            </p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {[
              { icon: '👁️', title: 'Radical Transparency', desc: 'Every transaction, vote, and claim is publicly verifiable on the Stellar blockchain.' },
              { icon: '🤝', title: 'Community First', desc: 'The pool is owned and governed by its members. No shareholders, no profit motive.' },
              { icon: '🌐', title: 'Global Access', desc: 'We\'re building for the 4 billion people who lack adequate health coverage worldwide.' },
            ].map(v => (
              <div key={v.title} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: '#fff7ed', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', flexShrink: 0 }}>{v.icon}</div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '.9rem', marginBottom: '.2rem' }}>{v.title}</div>
                  <p style={{ fontSize: '.85rem', color: '#78716c', margin: 0, lineHeight: 1.6 }}>{v.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      <section style={{ padding: '4rem 1.25rem', background: '#fafaf9', borderTop: '1px solid #e7e5e4' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <h2 style={{ fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-.02em', marginBottom: '.5rem' }}>Meet the Team</h2>
            <p style={{ color: '#78716c' }}>A distributed team united by a shared belief in open, accessible healthcare.</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem' }}>
            {TEAM.map(m => (
              <div key={m.name} className="card" style={{ textAlign: 'center', padding: '2rem 1.5rem' }}>
                <div style={{
                  width: 64, height: 64, borderRadius: '50%', background: m.color,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '1.5rem', margin: '0 auto 1rem',
                }}>{m.avatar}</div>
                <div style={{ fontWeight: 700, fontSize: '.95rem', marginBottom: '.2rem' }}>{m.name}</div>
                <div style={{ fontSize: '.78rem', color: '#f97316', fontWeight: 600, marginBottom: '.6rem' }}>{m.role}</div>
                <p style={{ fontSize: '.8rem', color: '#78716c', lineHeight: 1.6, margin: 0 }}>{m.bio}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Tech stack */}
      <section style={{ padding: '4rem 1.25rem', background: '#fff', borderTop: '1px solid #e7e5e4' }}>
        <div style={{ maxWidth: 860, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <h2 style={{ fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-.02em', marginBottom: '.5rem' }}>Built With</h2>
            <p style={{ color: '#78716c' }}>Open-source technology from the ground up.</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            {TECH.map(t => (
              <div key={t.name} className="card" style={{ display: 'flex', alignItems: 'center', gap: '.875rem', padding: '1.1rem 1.25rem' }}>
                <div style={{ fontSize: '1.5rem', flexShrink: 0 }}>{t.icon}</div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '.875rem' }}>{t.name}</div>
                  <div style={{ fontSize: '.75rem', color: '#78716c' }}>{t.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact */}
      <section style={{ padding: '4rem 1.25rem', background: '#fafaf9', borderTop: '1px solid #e7e5e4', textAlign: 'center' }}>
        <div style={{ maxWidth: 520, margin: '0 auto' }}>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-.02em', marginBottom: '.75rem' }}>Get in Touch</h2>
          <p style={{ color: '#78716c', marginBottom: '2rem', lineHeight: 1.7 }}>
            Have questions, ideas, or want to contribute? We'd love to hear from you.
            StellarCare is open source and community-driven.
          </p>
          <div style={{ display: 'flex', gap: '.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <a href="https://github.com" target="_blank" rel="noreferrer" className="btn btn-primary">
              GitHub →
            </a>
            <a href="mailto:hello@stellarcare.io" className="btn btn-outline">
              Email Us
            </a>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}

const TEAM = [
  { name: 'Alex Rivera', role: 'Co-founder & CEO', avatar: '👩‍💻', color: '#fff7ed', bio: 'Former health-tech engineer. Spent 8 years watching insurance companies deny claims. Decided to build the alternative.' },
  { name: 'Marcus Chen', role: 'Co-founder & CTO', avatar: '🧑‍🔬', color: '#eff6ff', bio: 'Stellar ecosystem contributor since 2019. Wrote the core smart contracts powering the pool.' },
  { name: 'Priya Nair', role: 'Head of Community', avatar: '👩‍🎨', color: '#f0fdf4', bio: 'Community builder and DeFi educator. Runs our governance forums and member onboarding.' },
  { name: 'Jordan Kim', role: 'Lead Frontend', avatar: '🧑‍💼', color: '#fdf4ff', bio: 'Full-stack developer focused on making Web3 interfaces feel as smooth as Web2.' },
]

const TECH = [
  { icon: '⭐', name: 'Stellar', desc: 'Layer-1 blockchain' },
  { icon: '🦀', name: 'Rust / Soroban', desc: 'Smart contracts' },
  { icon: '⚛️', name: 'React + TypeScript', desc: 'Frontend' },
  { icon: '🔑', name: 'Freighter', desc: 'Wallet integration' },
  { icon: '⚡', name: 'Vite', desc: 'Build tooling' },
  { icon: '🔗', name: 'Stellar SDK', desc: 'Blockchain interaction' },
]

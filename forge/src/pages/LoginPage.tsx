export default function LoginPage() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '70vh' }}>
      <div style={{
        width: 400,
        background: 'var(--color-surface)',
        border: '1px solid var(--color-rule)',
        borderRadius: 12,
        padding: 32,
      }}>
        <p style={{ fontSize: 22, fontWeight: 600, fontFamily: 'var(--font-mono)', color: 'var(--color-ink)' }}>Forge</p>
        <p style={{ fontSize: 13, fontFamily: 'var(--font-mono)', color: 'var(--color-dim)', marginTop: 2, marginBottom: 28 }}>Coach</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <input className="input" type="email" placeholder="Email" />
          <input className="input" type="password" placeholder="Password" />
          <button className="btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: 4 }}>
            Sign in →
          </button>
        </div>
      </div>
    </div>
  )
}

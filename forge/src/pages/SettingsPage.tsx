export default function SettingsPage() {
  return (
    <div style={{ maxWidth: 480 }}>
      <h1 style={{ fontSize: 24, fontWeight: 600, color: 'var(--color-ink)', marginBottom: 24 }}>Settings</h1>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {['First name', 'Last name', 'Email'].map((f) => (
          <div key={f}>
            <label className="label-mono" style={{ display: 'block', marginBottom: 4 }}>{f}</label>
            <input className="input" type={f === 'Email' ? 'email' : 'text'} />
          </div>
        ))}
        <hr className="section-divider" />
        <div>
          <label className="label-mono" style={{ display: 'block', marginBottom: 4 }}>New password</label>
          <input className="input" type="password" />
        </div>
        <button className="btn-primary" style={{ alignSelf: 'flex-start' }}>Save changes</button>
      </div>
    </div>
  )
}

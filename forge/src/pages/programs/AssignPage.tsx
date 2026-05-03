export default function AssignPage() {
  return (
    <div style={{ maxWidth: 540 }}>
      <h1 style={{ fontSize: 22, fontWeight: 600, color: 'var(--color-ink)', marginBottom: 4 }}>Forge Accumulation</h1>
      <p style={{ fontSize: 13, fontFamily: 'var(--font-mono)', color: 'var(--color-dim)', marginBottom: 28 }}>Assign to athletes</p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
          <label className="label-mono" style={{ display: 'block', marginBottom: 6 }}>Athletes</label>
          <input className="input" placeholder="Search by name…" />
        </div>
        <div>
          <label className="label-mono" style={{ display: 'block', marginBottom: 6 }}>Start date</label>
          <input className="input" type="date" />
        </div>
        <button className="btn-primary" style={{ alignSelf: 'flex-start' }}>Assign program →</button>
      </div>
    </div>
  )
}

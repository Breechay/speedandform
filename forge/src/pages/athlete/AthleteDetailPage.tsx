import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

export default function AthleteDetailPage() {
  const navigate = useNavigate()
  const [tab, setTab] = useState<'sessions' | 'programs'>('sessions')

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
        <button
          onClick={() => navigate('/forge/roster')}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-chrome)', fontSize: 20 }}
        >←</button>
        <h1 style={{ fontSize: 24, fontWeight: 600, color: 'var(--color-ink)' }}>Marcus Webb</h1>
      </div>
      <p style={{ fontSize: 13, fontFamily: 'var(--font-mono)', color: 'var(--color-dim)', marginBottom: 20, marginLeft: 34 }}>
        Forge Accumulation · Block A · Week 3
      </p>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid var(--color-rule)', marginBottom: 24 }}>
        {(['sessions', 'programs'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              padding: '8px 20px',
              background: 'none',
              border: 'none',
              borderBottom: tab === t ? '2px solid var(--color-accent)' : '2px solid transparent',
              cursor: 'pointer',
              fontSize: 14,
              fontWeight: 500,
              color: tab === t ? 'var(--color-ink)' : 'var(--color-chrome)',
              textTransform: 'capitalize',
              marginBottom: -1,
            }}
          >{t}</button>
        ))}
      </div>

      {tab === 'sessions' && (
        <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-rule)', borderRadius: 8, overflow: 'hidden' }}>
          {[
            { date: 'May 2', name: 'Upper A', status: 'Completed', duration: '52 min' },
            { date: 'Apr 30', name: 'Lower A', status: 'Completed', duration: '48 min' },
            { date: 'Apr 28', name: 'Upper B', status: 'Completed', duration: '55 min' },
            { date: 'May 4', name: 'Lower B', status: 'Scheduled', duration: '' },
          ].map((s, i) => (
            <div key={i} className="table-row" style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '12px 16px' }}>
              <span style={{ fontSize: 13, fontFamily: 'var(--font-mono)', color: 'var(--color-dim)', minWidth: 60 }}>{s.date}</span>
              <span style={{ flex: 1, fontSize: 14, color: 'var(--color-ink)' }}>{s.name}</span>
              <span className={`pill ${s.status === 'Completed' ? 'pill-amber' : 'pill-dim'}`}>{s.status}</span>
              {s.duration && <span style={{ fontSize: 13, fontFamily: 'var(--font-mono)', color: 'var(--color-dim)' }}>{s.duration}</span>}
            </div>
          ))}
        </div>
      )}

      {tab === 'programs' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
            <button className="btn-secondary">Assign program →</button>
          </div>
          <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-rule)', borderRadius: 8, overflow: 'hidden' }}>
            {[
              { name: 'Forge Accumulation', status: 'Active', start: 'Apr 14', end: '' },
              { name: 'Sprint Base', status: 'Completed', start: 'Jan 6', end: 'Mar 30' },
            ].map((p, i) => (
              <div key={i} className="table-row" style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '12px 16px' }}>
                <span style={{ flex: 1, fontSize: 15, fontWeight: 500, color: 'var(--color-ink)' }}>{p.name}</span>
                <span className={`pill ${p.status === 'Active' ? 'pill-amber' : 'pill-dim'}`}>{p.status}</span>
                <span style={{ fontSize: 13, fontFamily: 'var(--font-mono)', color: 'var(--color-dim)' }}>
                  {p.start}{p.end ? ` → ${p.end}` : ''}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

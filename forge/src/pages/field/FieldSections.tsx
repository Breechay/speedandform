import { Link } from 'react-router-dom'
import type { FieldPost, FieldRecordCard } from '../../api/field'
import { formatDate, formatDistance, formatDuration, formatPace } from '../../utils/format'

export function FieldStreamSection({ posts }: { posts: FieldPost[] }) {
  if (posts.length === 0) {
    return <div className="empty-state">Nothing here yet.</div>
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {posts.map((post) => (
        <div key={post.id} className="card" style={{ padding: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginBottom: 6 }}>
            <Link
              to={post.athleteSlug ? `/forge/field/${post.athleteSlug}` : '/forge/field'}
              style={{ color: 'var(--color-ink)', fontSize: 14, fontWeight: 500, textDecoration: 'none' }}
            >
              {post.athleteName}
            </Link>
            <span style={{ color: 'var(--color-dim)', fontSize: 11, fontFamily: 'var(--font-mono)' }}>
              {formatDate(post.postedAt)}
            </span>
          </div>
          {post.content && (
            <p style={{ color: 'var(--color-chrome)', fontSize: 14, whiteSpace: 'pre-wrap', marginBottom: post.imageUrl ? 10 : 8 }}>
              {post.content}
            </p>
          )}
          {post.imageUrl && (
            <img
              src={post.imageUrl}
              alt="Field post"
              style={{ width: '100%', maxHeight: 360, objectFit: 'cover', borderRadius: 8, border: '1px solid var(--color-rule-light)', marginBottom: 10 }}
            />
          )}

          {(post.reactions.length > 0 || post.replies.length > 0) && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {post.reactions.length > 0 && (
                <div style={{ display: 'flex', gap: 6 }}>
                  {post.reactions.map((emoji) => (
                    <span
                      key={`${post.id}-${emoji}`}
                      style={{
                        fontSize: 12,
                        padding: '2px 6px',
                        borderRadius: 999,
                        border: '1px solid var(--color-rule)',
                        background: 'var(--color-bg)',
                      }}
                    >
                      {emoji === 'heart' ? '❤️' : emoji === 'fire' ? '🔥' : emoji}
                    </span>
                  ))}
                </div>
              )}
              {post.replies.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                  {post.replies.map((reply) => (
                    <div key={reply.id} style={{ fontSize: 12, color: 'var(--color-chrome)' }}>
                      <span style={{ color: 'var(--color-ink)', fontWeight: 500 }}>{reply.athleteName}:</span> {reply.content}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

export function FieldRecordSection({ records, title = 'Record' }: { records: FieldRecordCard[]; title?: string }) {
  if (records.length === 0) {
    return <div className="empty-state">No record entries yet.</div>
  }

  return (
    <div>
      <h3 className="eyebrow" style={{ marginBottom: 10 }}>{title}</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {records.map((item) => (
          <div key={`${item.kind}-${item.id}`} className="card" style={{ padding: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, marginBottom: 4 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <Link
                  to={item.athleteSlug ? `/forge/field/${item.athleteSlug}` : '/forge/field'}
                  style={{ color: 'var(--color-ink)', fontSize: 13, fontWeight: 500, textDecoration: 'none' }}
                >
                  {item.athleteName}
                </Link>
                <span className="pill pill-dim">{item.kind === 'running' ? 'Running' : 'Strength'}</span>
              </div>
              <span style={{ color: 'var(--color-dim)', fontSize: 11, fontFamily: 'var(--font-mono)' }}>
                {formatDate(item.completedAt)}
              </span>
            </div>
            <div style={{ color: 'var(--color-ink)', fontSize: 13, marginBottom: 4 }}>{item.sessionLabel}</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, color: 'var(--color-dim)', fontSize: 11, fontFamily: 'var(--font-mono)' }}>
              <span>{formatDuration(item.durationSeconds)}</span>
              {item.kind === 'running' ? (
                <>
                  <span>{formatDistance(item.distanceMeters, 'km')}</span>
                  <span>{formatPace(item.avgPaceSecondsPerKm, 'km')}</span>
                </>
              ) : (
                item.topMovements.length > 0 && <span>{item.topMovements.join(' · ')}</span>
              )}
            </div>
            {item.note && (
              <p style={{ marginTop: 6, color: 'var(--color-chrome)', fontSize: 12, whiteSpace: 'pre-wrap' }}>{item.note}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

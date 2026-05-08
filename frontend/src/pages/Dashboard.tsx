import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { listVendors } from '../api/client'
import type { LeadTier } from '../types'

const TIER_DOT: Record<LeadTier, string> = { hot: 'var(--hot)', warm: 'var(--warm)', cold: 'var(--cold)' }

function tierChip(tier: LeadTier) {
  const map = {
    hot: { bg: '#f973161a', border: '#f9731633', color: '#f97316' },
    warm: { bg: '#e8c5471a', border: '#e8c54733', color: '#e8c547' },
    cold: { bg: '#6b72801a', border: '#6b728033', color: '#6b7280' },
  }
  return map[tier]
}

export default function Dashboard() {
  const { data: vendors = [], isLoading } = useQuery({ queryKey: ['vendors'], queryFn: listVendors })
  const stats = {
    total: vendors.length,
    hot: vendors.filter(v => v.tier === 'hot').length,
    warm: vendors.filter(v => v.tier === 'warm').length,
    cold: vendors.filter(v => v.tier === 'cold').length,
  }

  return (
    <div className="app-page">
      <h1 className="page-title">Dashboard</h1>
      <p className="page-subtitle">Track your vendor pipeline and prioritize outreach.</p>

      <div style={{ marginTop: 22, display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 12 }}>
        {[
          ['TOTAL VENDORS', stats.total, 'var(--text-primary)'],
          ['HOT', stats.hot, 'var(--hot)'],
          ['WARM', stats.warm, 'var(--warm)'],
          ['COLD', stats.cold, 'var(--cold)'],
        ].map(([label, value, color]) => (
          <div key={String(label)} className="card card-pad" style={{ minHeight: 120 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: String(color) }} />
              <span className="section-label">{label}</span>
            </div>
            <div style={{ marginTop: 14, fontFamily: 'monospace', fontSize: 34, color: String(color) }}>{value}</div>
          </div>
        ))}
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <div style={{ padding: 20, borderBottom: '1px solid var(--divider)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span className="page-title" style={{ fontSize: 18 }}>Recent Vendors</span>
          <Link to="/vendors/new" style={{
            border: '1px solid var(--border)', borderRadius: 8, textDecoration: 'none',
            color: 'var(--text-secondary)', padding: '8px 12px', fontSize: 13,
          }}>+ New Vendor</Link>
        </div>

        {isLoading ? (
          <div style={{ padding: 20, color: 'var(--text-secondary)', fontSize: 14 }}>Loading vendors...</div>
        ) : vendors.length === 0 ? (
          <div style={{ padding: 20, color: 'var(--text-secondary)', fontSize: 14 }}>No vendors yet.</div>
        ) : (
          vendors.slice(0, 6).map(v => (
            <Link key={v.id} to={`/vendors/${v.id}`} style={{
              display: 'grid', gridTemplateColumns: '36px 1fr auto auto auto', gap: 12, alignItems: 'center',
              padding: '12px 20px', borderBottom: '1px solid var(--divider)', textDecoration: 'none',
            }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--surface-elevated)', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13 }}>
                {v.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <div style={{ color: 'var(--text-primary)', fontSize: 14 }}>{v.name}</div>
                <div style={{ color: 'var(--text-secondary)', fontSize: 12 }}>{v.location}</div>
              </div>
              {v.tier && (
                <span style={{
                  background: tierChip(v.tier).bg,
                  border: `1px solid ${tierChip(v.tier).border}`,
                  color: tierChip(v.tier).color,
                  borderRadius: 6,
                  padding: '2px 8px',
                  fontSize: 11,
                  textTransform: 'uppercase',
                }}>{v.tier}</span>
              )}
              <span style={{ fontFamily: 'monospace', color: v.tier ? TIER_DOT[v.tier] : 'var(--text-secondary)', fontSize: 14 }}>{v.score ?? '--'}</span>
              <span style={{ color: 'var(--text-muted)' }}>�</span>
            </Link>
          ))
        )}
      </div>

      <style>{`
        @media (max-width: 900px) {
          .app-page > div:first-of-type { grid-template-columns: 1fr 1fr !important; }
        }
      `}</style>
    </div>
  )
}
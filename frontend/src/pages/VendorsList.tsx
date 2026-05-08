import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { listVendors } from '../api/client'
import type { LeadTier } from '../types'

const tiers: Array<LeadTier | 'all'> = ['all', 'hot', 'warm', 'cold']

const chip = {
  hot: { bg: '#f973161a', border: '#f9731633', color: '#f97316' },
  warm: { bg: '#e8c5471a', border: '#e8c54733', color: '#e8c547' },
  cold: { bg: '#6b72801a', border: '#6b728033', color: '#6b7280' },
}

export default function VendorsList() {
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<LeadTier | 'all'>('all')
  const { data: vendors = [] } = useQuery({ queryKey: ['vendors'], queryFn: listVendors })

  const filtered = vendors.filter(v => {
    const q = search.toLowerCase()
    const okText = v.name.toLowerCase().includes(q) || v.location.toLowerCase().includes(q)
    const okTier = filter === 'all' || v.tier === filter
    return okText && okTier
  })

  return (
    <div className="app-page" style={{ maxWidth: 'none' }}>
      <h1 className="page-title">Vendors</h1>
      <div style={{ marginTop: 14, display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search vendors" style={{ background: 'transparent', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-secondary)', padding: '9px 12px', minWidth: 220 }} />
        <div style={{ display: 'flex', gap: 6 }}>
          {tiers.map(t => (
            <button key={t} onClick={() => setFilter(t)} style={{
              border: '1px solid var(--border)', borderRadius: 6, padding: '6px 10px', textTransform: 'capitalize',
              background: filter === t ? 'var(--accent-soft)' : 'var(--surface-elevated)',
              color: filter === t ? 'var(--accent-primary)' : 'var(--text-secondary)', fontSize: 12,
            }}>{t}</button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 80, color: 'var(--text-secondary)' }}>
          <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>No vendors yet</div>
          <Link to="/vendors/new" style={{ color: 'var(--accent-primary)', textDecoration: 'none', marginTop: 8, display: 'inline-block' }}>Add your first vendor ?</Link>
        </div>
      ) : (
        <table style={{ width: '100%', marginTop: 16, borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--divider)' }}>
              {['Vendor', 'Category', 'Location', 'Score', 'Tier'].map(h => <th key={h} style={{ textAlign: 'left', padding: '10px 12px', fontSize: 12, fontWeight: 500, color: 'var(--text-muted)', letterSpacing: '0.16em' }}>{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {filtered.map(v => (
              <tr key={v.id} style={{ background: 'var(--surface)', borderBottom: '1px solid var(--divider)' }}>
                <td style={{ padding: '12px' }}><Link to={`/vendors/${v.id}`} style={{ color: 'var(--text-primary)', textDecoration: 'none' }}>{v.name}</Link></td>
                <td style={{ padding: '12px', color: 'var(--text-secondary)', fontSize: 14 }}>{v.category.replace('_', ' ')}</td>
                <td style={{ padding: '12px', color: 'var(--text-secondary)', fontSize: 14 }}>{v.location}</td>
                <td style={{ padding: '12px', color: 'var(--text-primary)', fontFamily: 'monospace' }}>{v.score ?? '--'}</td>
                <td style={{ padding: '12px' }}>{v.tier && <span style={{ background: chip[v.tier].bg, border: `1px solid ${chip[v.tier].border}`, color: chip[v.tier].color, borderRadius: 6, padding: '2px 8px', fontSize: 11, textTransform: 'uppercase' }}>{v.tier}</span>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
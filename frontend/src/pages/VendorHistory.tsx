import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { getHistory, getVendor, triggerFollowUp } from '../api/client'

function when(ts: string | null) {
  if (!ts) return '--'
  return new Date(ts).toLocaleString('en-IN', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export default function VendorHistory() {
  const { vendorId: vendorIdParam } = useParams<{ vendorId: string }>()
  const vendorId = Number(vendorIdParam)
  const qc = useQueryClient()
  const [context, setContext] = useState('')

  const { data: vendor } = useQuery({ queryKey: ['vendor', vendorId], queryFn: () => getVendor(vendorId), enabled: !!vendorId })
  const { data: history = [] } = useQuery({ queryKey: ['history', vendorId], queryFn: () => getHistory(vendorId), enabled: !!vendorId })

  const followup = useMutation({
    mutationFn: () => triggerFollowUp(vendorId, context || undefined),
    onSuccess: () => { toast.success('Follow-up generated'); setContext(''); qc.invalidateQueries({ queryKey: ['history', vendorId] }) },
  })

  return (
    <div className="app-page" style={{ maxWidth: 920 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="page-title">{vendor?.name} History</h1>
          <p className="page-subtitle">Timeline of interactions and generated outreach.</p>
        </div>
        <button onClick={() => followup.mutate()} style={{ border: '1px solid var(--border)', borderRadius: 8, background: 'transparent', color: 'var(--text-secondary)', padding: '8px 12px' }}>Generate Follow-up</button>
      </div>

      <div style={{ marginTop: 12 }}>
        <input value={context} onChange={e => setContext(e.target.value)} placeholder="Optional context" style={{ width: '100%', background: 'var(--surface-elevated)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)', padding: '10px 12px' }} />
      </div>

      <div style={{ position: 'relative', marginTop: 18, paddingLeft: 28 }}>
        <div style={{ position: 'absolute', left: 10, top: 0, bottom: 0, width: 1, background: 'var(--divider)' }} />

        {history.map(item => (
          <div key={item.id} style={{ position: 'relative', paddingBottom: 18 }}>
            <span style={{ position: 'absolute', left: -21, top: 5, width: 8, height: 8, borderRadius: '50%', background: 'var(--text-muted)' }} />
            <div style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'monospace' }}>{when(item.timestamp)}</div>
            <div style={{ marginTop: 6 }}><span style={{ background: 'var(--surface-elevated)', border: '1px solid var(--border)', color: 'var(--text-secondary)', borderRadius: 6, padding: '2px 8px', fontSize: 11 }}>{item.type}</span></div>
            <div style={{ color: 'var(--text-secondary)', marginTop: 8, fontSize: 14 }}>{JSON.stringify(item.content).slice(0, 180)}</div>
          </div>
        ))}

        {followup.isPending && (
          <div style={{ height: 52, borderRadius: 8, background: 'var(--surface-elevated)', animation: 'pulseRow 1.3s ease-in-out infinite' }} />
        )}
      </div>

      <style>{`@keyframes pulseRow { from { background-position: 200% 0; } to { background-position: -200% 0; } }`}</style>
    </div>
  )
}

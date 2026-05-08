import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { getLastRun, getVendor } from '../api/client'
import { Copy, Check, ChevronDown, ChevronUp } from 'lucide-react'

const tabs = ['Summary', 'Qualification', 'Pitch', 'Campaign']

function CopyButton({ value, id }: { value: string; id: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button id={id} onClick={async () => { await navigator.clipboard.writeText(value); setCopied(true); setTimeout(() => setCopied(false), 1200) }} style={{ border: '1px solid var(--border)', borderRadius: 8, background: 'var(--surface-elevated)', color: 'var(--text-secondary)', fontSize: 12, padding: '4px 10px', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
      {copied ? <Check size={12} /> : <Copy size={12} />} {copied ? 'Copied' : 'Copy'}
    </button>
  )
}

function PostRow({ post }: { post: any }) {
  const [open, setOpen] = useState(false)
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '64px 1fr', gap: 10, alignItems: 'start' }}>
      <div style={{ fontFamily: 'monospace', fontSize: 12, color: 'var(--text-muted)', paddingTop: 10 }}>Day {post.day}</div>
      <div className="card" style={{ overflow: 'hidden' }}>
        <button onClick={() => setOpen(v => !v)} style={{ width: '100%', border: 'none', background: 'transparent', color: 'var(--text-primary)', padding: 14, display: 'flex', justifyContent: 'space-between', cursor: 'pointer' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ background: 'var(--surface-elevated)', border: '1px solid var(--border)', color: 'var(--text-secondary)', borderRadius: 6, padding: '2px 8px', fontSize: 11 }}>{post.type}</span>
            <span style={{ fontSize: 14 }}>{post.hook}</span>
          </div>
          {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
        {open && <div style={{ borderTop: '1px solid var(--divider)', padding: 14, color: 'var(--text-secondary)', fontSize: 13, lineHeight: 1.65 }}>{post.caption}</div>}
      </div>
    </div>
  )
}

export default function VendorResult() {
  const { vendorId: vendorIdParam } = useParams<{ vendorId: string }>()
  const vendorId = Number(vendorIdParam)
  const [active, setActive] = useState(0)

  const { data: vendor } = useQuery({
    queryKey: ['vendor', vendorId],
    queryFn: () => getVendor(vendorId),
    enabled: !!vendorId,
  })

  const {
    data: run,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['lastrun', vendorId],
    queryFn: () => getLastRun(vendorId),
    enabled: !!vendorId,
  })

  if (!vendorId) return <div className="app-page">Invalid vendor ID.</div>
  if (isLoading) return <div className="app-page">Loading vendor run data...</div>
  if (isError) return <div className="app-page">Failed to load vendor run data: {(error as Error).message}</div>
  if (!run) return <div className="app-page">No run data available.</div>

  const tierColor = run.qualification?.tier === 'hot' ? 'var(--hot)' : run.qualification?.tier === 'warm' ? 'var(--warm)' : 'var(--cold)'

  return (
    <div className="app-page" style={{ maxWidth: 1020 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="page-title">{vendor?.name}</h1>
          <p className="page-subtitle">{vendor?.location}</p>
        </div>
        <Link to={`/vendors/${vendorId}/history`} style={{ border: '1px solid var(--border)', borderRadius: 8, padding: '8px 12px', textDecoration: 'none', color: 'var(--text-secondary)', fontSize: 13 }}>History</Link>
      </div>

      <div style={{ marginTop: 18, borderBottom: '1px solid var(--border)', display: 'flex', gap: 16 }}>
        {tabs.map((tab, i) => (
          <button key={tab} onClick={() => setActive(i)} style={{ border: 'none', borderBottom: active === i ? '2px solid var(--accent-primary)' : '2px solid transparent', background: 'transparent', color: active === i ? 'var(--text-primary)' : 'var(--text-muted)', padding: '10px 0', fontSize: 14, cursor: 'pointer' }}>{tab}</button>
        ))}
      </div>

      {active === 0 && (
        <div style={{ marginTop: 16, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div className="card card-pad">
            <div className="section-label">Overview</div>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.7 }}>{run.summary?.overview ?? 'Not available yet.'}</p>
            <div style={{ marginTop: 12 }} className="section-label">Audience</div>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>{run.summary?.target_audience ?? 'Not available yet.'}</p>
          </div>
          <div className="card card-pad">
            <div className="section-label">USPs</div>
            {(run.summary?.usps ?? []).length > 0
              ? (run.summary?.usps ?? []).map((u, i) => <div key={i} style={{ color: 'var(--text-secondary)', fontSize: 14, marginTop: 8 }}><span style={{ color: 'var(--accent-primary)' }}>-</span> {u}</div>)
              : <div style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 8 }}>No USPs available.</div>}
            <div className="section-label" style={{ marginTop: 14 }}>Pain Points</div>
            {(run.summary?.pain_points ?? []).length > 0
              ? (run.summary?.pain_points ?? []).map((p, i) => <div key={i} style={{ color: 'var(--text-secondary)', fontSize: 14, marginTop: 8 }}><span style={{ color: 'var(--text-muted)' }}>-</span> {p}</div>)
              : <div style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 8 }}>No pain points available.</div>}
            <div style={{ marginTop: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><span className="section-label">Digital Presence</span><span style={{ fontFamily: 'monospace', color: 'var(--text-primary)' }}>{run.summary?.digital_presence_score ?? 0} / 100</span></div>
            <div style={{ marginTop: 8, height: 4, borderRadius: 999, background: 'var(--surface-elevated)' }}><div style={{ height: '100%', width: `${run.summary?.digital_presence_score ?? 0}%`, borderRadius: 999, background: 'var(--accent-primary)' }} /></div>
          </div>
        </div>
      )}

      {active === 1 && (
        <div className="card card-pad" style={{ marginTop: 16 }}>
          <div style={{ textAlign: 'center', fontFamily: 'monospace', fontSize: 64, color: tierColor }}>{run.qualification?.score ?? '--'}</div>
          <div style={{ display: 'flex', justifyContent: 'center' }}><span style={{ background: 'var(--surface-elevated)', border: '1px solid var(--border)', color: tierColor, borderRadius: 6, padding: '2px 8px', fontSize: 12, textTransform: 'uppercase' }}>{run.qualification?.tier ?? 'unknown'}</span></div>
          <div style={{ marginTop: 16, background: 'var(--surface-elevated)', borderRadius: 8, padding: 14, borderLeft: '2px solid var(--accent-primary)', fontStyle: 'italic', color: 'var(--text-secondary)' }}>{run.qualification?.reasoning ?? 'Qualification details are not available yet.'}</div>
          <div style={{ marginTop: 14, display: 'flex', justifyContent: 'space-between' }}><span className="section-label">Confidence</span><span style={{ fontFamily: 'monospace' }}>{Math.round((run.qualification?.confidence ?? 0) * 100)}</span></div>
          <div style={{ marginTop: 8, height: 4, borderRadius: 999, background: 'var(--surface-elevated)' }}><div style={{ height: '100%', width: `${Math.round((run.qualification?.confidence ?? 0) * 100)}%`, borderRadius: 999, background: tierColor }} /></div>
        </div>
      )}

      {active === 2 && (
        <div style={{ marginTop: 16, display: 'grid', gap: 12 }}>
          <div className="card card-pad">
            <div className="section-label">Email Subject</div>
            <div style={{ marginTop: 8, background: 'var(--surface-elevated)', borderRadius: 8, padding: 12, color: 'var(--text-primary)' }}>{run.pitch?.subject ?? 'Not available yet.'}</div>
          </div>
          <div className="card card-pad" style={{ position: 'relative' }}>
            <div className="section-label">Email Body</div>
            <div style={{ position: 'absolute', right: 20, top: 16 }}>{run.pitch?.email_body ? <CopyButton value={run.pitch.email_body} id="copy-email" /> : null}</div>
            <pre style={{ marginTop: 10, fontFamily: 'monospace', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: 12, color: 'var(--text-secondary)', fontSize: 13, whiteSpace: 'pre-wrap' }}>{run.pitch?.email_body ?? 'Not available yet.'}</pre>
          </div>
          <div className="card card-pad" style={{ borderLeft: '4px solid var(--success)' }}>
            <div className="section-label">Whatsapp Version</div>
            <div style={{ marginTop: 8, color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.65 }}>{run.pitch?.whatsapp_version ?? 'Not available yet.'}</div>
          </div>
          <div className="card card-pad">
            <div className="section-label">Follow-ups</div>
            {(run.pitch?.follow_ups ?? []).length > 0 ? (run.pitch?.follow_ups ?? []).map((f, i) => (
              <div key={i} style={{ borderTop: i === 0 ? '1px solid transparent' : '1px solid var(--divider)', paddingTop: 10, marginTop: 10, display: 'grid', gridTemplateColumns: '70px 1fr', gap: 12 }}>
                <div style={{ fontFamily: 'monospace', color: 'var(--text-muted)' }}>{String(i + 1).padStart(2, '0')}</div>
                <div style={{ color: 'var(--text-secondary)', fontSize: 14 }}>{f}</div>
              </div>
            )) : <div style={{ color: 'var(--text-muted)', marginTop: 10 }}>No follow-ups available.</div>}
          </div>
        </div>
      )}

      {active === 3 && (
        <div style={{ marginTop: 16, display: 'grid', gap: 12 }}>
          <div className="card card-pad" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: 20, color: 'var(--text-primary)', fontWeight: 500 }}>{run.campaign?.theme ?? 'Campaign not available yet.'}</div>
            <span style={{ fontFamily: 'monospace', background: 'var(--surface-elevated)', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text-secondary)', fontSize: 12, padding: '2px 8px' }}>{run.campaign?.duration_days ?? 0} days</span>
          </div>
          <div className="card card-pad">{(run.campaign?.posts ?? []).length > 0 ? (run.campaign?.posts ?? []).map((p, i) => <PostRow key={i} post={p} />) : <div style={{ color: 'var(--text-muted)' }}>No posts available.</div>}</div>
          <div className="card card-pad">
            <div className="section-label">Ad Ideas</div>
            {(run.campaign?.ad_ideas ?? []).length > 0 ? (run.campaign?.ad_ideas ?? []).map((a, i) => <div key={i} style={{ color: 'var(--text-secondary)', fontSize: 14, marginTop: 8 }}>{i + 1}. {a}</div>) : <div style={{ color: 'var(--text-muted)', marginTop: 8 }}>No ad ideas available.</div>}
          </div>
          <div className="card card-pad" style={{ background: 'var(--surface-elevated)', borderLeft: '2px solid var(--accent-primary)' }}>
            <div className="section-label">Expected Outcomes</div>
            {(run.campaign?.expected_outcomes ?? []).length > 0 ? (run.campaign?.expected_outcomes ?? []).map((o, i) => <div key={i} style={{ color: 'var(--text-secondary)', fontSize: 14, marginTop: 8 }}>{o}</div>) : <div style={{ color: 'var(--text-muted)', marginTop: 8 }}>No expected outcomes available.</div>}
          </div>
        </div>
      )}

      <style>{`@media (max-width: 900px) { .app-page > div:nth-of-type(3) { grid-template-columns: 1fr !important; } }`}</style>
    </div>
  )
}

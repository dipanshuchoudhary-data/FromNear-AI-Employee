import { useQuery } from '@tanstack/react-query'
import { getHealth } from '../api/client'

const BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000'

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ padding: '14px 0', borderBottom: '1px solid var(--divider)' }}>
      <div className="section-label">{label}</div>
      <div style={{ marginTop: 6, fontFamily: 'monospace', color: 'var(--text-primary)', fontSize: 14 }}>{value}</div>
    </div>
  )
}

export default function Settings() {
  const { data, isLoading } = useQuery({ queryKey: ['health'], queryFn: getHealth, refetchInterval: 15000, retry: false })
  const healthy = !isLoading && data?.status === 'ok'

  return (
    <div className="app-page" style={{ maxWidth: 820 }}>
      <h1 className="page-title">Settings</h1>
      <p className="page-subtitle">Environment and runtime configuration.</p>

      <div style={{ marginTop: 18, borderBottom: '1px solid var(--divider)', paddingBottom: 14 }}>
        <div className="section-label">Health Status</div>
        <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-secondary)', fontSize: 14 }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: healthy ? 'var(--success)' : 'var(--error)' }} />
          {isLoading ? 'Checking...' : healthy ? 'Healthy' : 'Unreachable'}
        </div>
      </div>

      <Row label="API Base URL" value={BASE} />
      <Row label="Environment" value={import.meta.env.MODE} />
      <Row label="Backend Health Endpoint" value={`${BASE}/api/v1/health`} />
      <Row label="Default LLM Base" value="http://localhost:11434/v1" />
      <Row label="Chat Model Example" value="llama3.2 / mistral / phi3" />
      <Row label="Embed Model Example" value="nomic-embed-text" />
    </div>
  )
}
import { useEffect, useMemo, useState } from 'react'
import { Link, Outlet, useLocation } from 'react-router-dom'
import { LayoutDashboard, Plus, Users, Settings, Moon, Sun, Menu } from 'lucide-react'

const NAV_ITEMS = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/vendors/new', label: 'New Vendor', icon: Plus },
  { path: '/vendors', label: 'Vendors', icon: Users },
  { path: '/settings', label: 'Settings', icon: Settings },
]

export default function AppLayout() {
  const location = useLocation()
  const [dark, setDark] = useState(() => localStorage.getItem('theme') !== 'light')
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    document.documentElement.classList.toggle('light', !dark)
    document.documentElement.style.colorScheme = dark ? 'dark' : 'light'
    localStorage.setItem('theme', dark ? 'dark' : 'light')
  }, [dark])

  const statusText = useMemo(() => 'Ollama Connected', [])

  const Sidebar = ({ mobile = false }: { mobile?: boolean }) => (
    <aside style={{
      width: mobile ? '100%' : 250,
      background: 'var(--bg-base)',
      borderRight: '1px solid var(--divider)',
      minHeight: mobile ? 'auto' : '100vh',
      display: 'flex',
      flexDirection: 'column',
    }}>
      <div style={{ padding: '20px 18px', borderBottom: '1px solid var(--divider)', display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 14, height: 14, transform: 'rotate(45deg)', background: 'var(--accent-primary)', borderRadius: 2 }} />
        <div>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>FromNear</div>
          <div className="section-label" style={{ marginTop: 2 }}>AI Sales Tool</div>
        </div>
      </div>

      <nav style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 4, flex: 1 }}>
        {NAV_ITEMS.map(({ path, label, icon: Icon }) => {
          const active = path === '/' ? location.pathname === '/' : location.pathname.startsWith(path)
          return (
            <Link
              key={path}
              to={path}
              onClick={() => setSidebarOpen(false)}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                textDecoration: 'none', padding: '10px 12px', borderRadius: 8,
                color: active ? 'var(--accent-primary)' : 'var(--text-muted)',
                background: active ? 'var(--accent-soft)' : 'transparent',
                fontSize: 14, fontWeight: 500,
              }}
            >
              <Icon size={15} />
              {label}
            </Link>
          )
        })}
      </nav>

      <div style={{ padding: 14, borderTop: '1px solid var(--divider)' }}>
        <button
          onClick={() => setDark(d => !d)}
          style={{
            width: '100%', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 10px',
            background: 'var(--surface-elevated)', color: 'var(--text-secondary)',
            display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13,
          }}
        >
          {dark ? <Sun size={14} /> : <Moon size={14} />} {dark ? 'Light mode' : 'Dark mode'}
        </button>
      </div>
    </aside>
  )

  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: 'var(--bg-base)' }}>
      <div className="desktop-sidebar"><Sidebar /></div>

      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 100, display: 'flex' }}
        >
          <div onClick={e => e.stopPropagation()} style={{ width: 260 }}><Sidebar mobile /></div>
        </div>
      )}

      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        <header style={{
          height: 60,
          background: 'var(--bg-base)',
          borderBottom: '1px solid var(--divider)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 20px',
          position: 'sticky',
          top: 0,
          zIndex: 50,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button
              className="mobile-only"
              onClick={() => setSidebarOpen(true)}
              style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: 4 }}
            >
              <Menu size={18} />
            </button>
            <span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>AI-Powered Sales and Marketing</span>
          </div>

          <div style={{
            background: 'var(--surface-elevated)',
            border: '1px solid var(--border)',
            borderRadius: 999,
            padding: '5px 10px',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            fontSize: 12,
            color: 'var(--text-secondary)',
          }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--success)' }} />
            {statusText}
          </div>
        </header>

        <main style={{ flex: 1, overflow: 'auto' }} className="scrollbar-thin scrollbar-track-[#0e0e0e] scrollbar-thumb-[#2a2a2a]">
          <Outlet />
        </main>
      </div>

      <style>{`
        .mobile-only { display: none; }
        @media (max-width: 900px) {
          .desktop-sidebar { display: none; }
          .mobile-only { display: inline-flex; }
        }
      `}</style>
    </div>
  )
}
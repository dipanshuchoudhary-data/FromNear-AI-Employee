import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { runVendor } from '../api/client'
import type { VendorInput, VendorCategory } from '../types'
import { X } from 'lucide-react'

const CATEGORIES: { value: VendorCategory; label: string }[] = [
  { value: 'food_beverage', label: 'Food and Beverage' },
  { value: 'retail', label: 'Retail' },
  { value: 'services', label: 'Services' },
  { value: 'healthcare', label: 'Healthcare' },
  { value: 'education', label: 'Education' },
  { value: 'fashion', label: 'Fashion' },
  { value: 'beauty_wellness', label: 'Beauty and Wellness' },
  { value: 'home_decor', label: 'Home Decor' },
  { value: 'electronics', label: 'Electronics' },
  { value: 'other', label: 'Other' },
]

const phases = ['Researching', 'Qualifying', 'Drafting pitch', 'Building campaign']

export default function NewVendor() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [phaseIndex, setPhaseIndex] = useState(0)
  const [form, setForm] = useState<Omit<VendorInput, 'products'> & { productInput: string; products: string[] }>({
    name: '', website: '', instagram: '', category: 'food_beverage', location: '', products: [], productInput: '',
  })

  const mutation = useMutation({
    mutationFn: (input: VendorInput) => runVendor(input),
    onSuccess: data => {
      queryClient.setQueryData(['lastrun', data.vendor_id], data)
      toast.success(`Pipeline complete for ${form.name}`)
      navigate(`/vendors/${data.vendor_id}`)
    },
    onError: (err: Error) => toast.error(err.message || 'Pipeline failed'),
  })

  useEffect(() => {
    if (!mutation.isPending) return
    const timer = setInterval(() => setPhaseIndex(i => (i + 1) % phases.length), 3000)
    return () => clearInterval(timer)
  }, [mutation.isPending])

  const addProduct = () => {
    const p = form.productInput.trim()
    if (p && !form.products.includes(p)) setForm(f => ({ ...f, products: [...f.products, p], productInput: '' }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name || !form.location || !form.products.length) return toast.error('Name, location, and products are required')
    mutation.mutate({ ...form, products: form.products })
  }

  const labelStyle: React.CSSProperties = { fontSize: 12, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.16em', color: 'var(--text-muted)', marginBottom: 6, display: 'block' }
  const inputStyle: React.CSSProperties = { width: '100%', background: 'var(--surface-elevated)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)', padding: '10px 12px', fontSize: 14, fontFamily: 'inherit' }

  return (
    <div className="app-page" style={{ maxWidth: 960 }}>
      <h1 className="page-title">New Vendor</h1>
      <p className="page-subtitle">Enter details and run end-to-end AI qualification.</p>

      <form onSubmit={handleSubmit} style={{ marginTop: 20 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <div>
            <label style={labelStyle}>Business Name</label>
            <input style={inputStyle} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
          </div>
          <div>
            <label style={labelStyle}>Location</label>
            <input style={inputStyle} value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} required />
          </div>
          <div>
            <label style={labelStyle}>Category</label>
            <select style={{ ...inputStyle, appearance: 'none', cursor: 'pointer' }} value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value as VendorCategory }))}>
              {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Website</label>
            <input style={inputStyle} value={form.website ?? ''} onChange={e => setForm(f => ({ ...f, website: e.target.value }))} />
          </div>
          <div>
            <label style={labelStyle}>Instagram</label>
            <input style={inputStyle} value={form.instagram ?? ''} onChange={e => setForm(f => ({ ...f, instagram: e.target.value }))} />
          </div>
          <div>
            <label style={labelStyle}>Products</label>
            <div style={{ display: 'flex', gap: 8 }}>
              <input style={inputStyle} value={form.productInput} onChange={e => setForm(f => ({ ...f, productInput: e.target.value }))} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addProduct() } }} />
              <button type="button" onClick={addProduct} style={{ border: '1px solid var(--border)', borderRadius: 8, background: 'transparent', color: 'var(--text-secondary)', padding: '0 12px' }}>Add</button>
            </div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
              {form.products.map(p => (
                <span key={p} style={{ background: 'var(--surface-elevated)', border: '1px solid var(--border)', color: 'var(--text-secondary)', fontSize: 12, borderRadius: 6, padding: '2px 8px', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  {p}
                  <button type="button" onClick={() => setForm(f => ({ ...f, products: f.products.filter(x => x !== p) }))} style={{ border: 'none', background: 'transparent', color: 'var(--text-secondary)', cursor: 'pointer', padding: 0 }}><X size={12} /></button>
                </span>
              ))}
            </div>
          </div>
        </div>

        <button type="submit" disabled={mutation.isPending} style={{
          marginTop: 18,
          width: '100%',
          border: 'none',
          borderRadius: 8,
          background: 'var(--accent-primary)',
          color: '#0e0e0e',
          padding: '12px 14px',
          fontSize: 14,
          fontWeight: 500,
          cursor: mutation.isPending ? 'not-allowed' : 'pointer',
          position: 'relative',
          overflow: 'hidden',
        }}>
          {mutation.isPending ? `${phases[phaseIndex]}...` : 'Run AI Pipeline ?'}
          {mutation.isPending && <span style={{ position: 'absolute', left: 0, bottom: 0, height: 2, width: '40%', background: 'var(--accent-primary)', animation: 'runline 1.6s linear infinite' }} />}
        </button>
      </form>

      <style>{`
        @keyframes runline { from { transform: translateX(-100%);} to { transform: translateX(260%);} }
        @media (max-width: 900px) {
          form > div:first-child { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  )
}

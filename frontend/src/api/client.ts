import axios from 'axios'
import type {
  VendorInput,
  RunResult,
  VendorListItem,
  VendorDetail,
  LastRunArtifacts,
  InteractionRecord,
  FollowUpResponse,
} from '../types'

// Reads base URL from .env — VITE_API_BASE_URL
const BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000'

export const apiClient = axios.create({
  baseURL: `${BASE}/api/v1`,
  headers: { 'Content-Type': 'application/json' },
  timeout: 600_000, // 10 min — pipeline can take a while
})

// ── Health ────────────────────────────────────────────────────────────────────

export async function getHealth(): Promise<{ status: string }> {
  const { data } = await apiClient.get('/health')
  return data
}

// ── Run Pipeline ──────────────────────────────────────────────────────────────

export async function runVendor(input: VendorInput): Promise<RunResult> {
  const { data } = await apiClient.post<RunResult>('/vendors/run', input)
  return data
}

// ── Vendor List ───────────────────────────────────────────────────────────────

export async function listVendors(): Promise<VendorListItem[]> {
  const { data } = await apiClient.get<VendorListItem[]>('/vendors')
  return data
}

// ── Vendor Detail ─────────────────────────────────────────────────────────────

export async function getVendor(id: number): Promise<VendorDetail> {
  const { data } = await apiClient.get<VendorDetail>(`/vendors/${id}`)
  return data
}

// ── Last Run ──────────────────────────────────────────────────────────────────

export async function getLastRun(id: number): Promise<LastRunArtifacts> {
  const { data } = await apiClient.get<LastRunArtifacts>(`/vendors/${id}/run`)
  return data
}

// ── History ───────────────────────────────────────────────────────────────────

export async function getHistory(id: number): Promise<InteractionRecord[]> {
  const { data } = await apiClient.get<InteractionRecord[]>(`/vendors/${id}/history`)
  return data
}

// ── Follow-up ─────────────────────────────────────────────────────────────────

export async function triggerFollowUp(
  id: number,
  additionalContext?: string
): Promise<FollowUpResponse> {
  const { data } = await apiClient.post<FollowUpResponse>(`/vendors/${id}/followup`, {
    additional_context: additionalContext ?? null,
  })
  return data
}

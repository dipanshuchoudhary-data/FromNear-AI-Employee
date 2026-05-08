// TypeScript mirrors of all backend Pydantic schemas

export type VendorCategory =
  | 'food_beverage'
  | 'retail'
  | 'services'
  | 'healthcare'
  | 'education'
  | 'fashion'
  | 'beauty_wellness'
  | 'home_decor'
  | 'electronics'
  | 'other'

export interface VendorInput {
  name: string
  website?: string | null
  instagram?: string | null
  category: VendorCategory
  location: string
  products: string[]
}

export interface BusinessSummary {
  overview: string
  target_audience: string
  usps: string[]
  pain_points: string[]
  digital_presence_score: number
}

export type LeadTier = 'hot' | 'warm' | 'cold'

export interface QualificationScore {
  score: number
  tier: LeadTier
  reasoning: string
  confidence: number
}

export interface SalesPitch {
  subject: string
  hook: string
  value_props: string[]
  cta: string
  email_body: string
  whatsapp_version: string
  follow_ups: [string, string, string]
}

export interface InstagramPost {
  day: number
  type: string
  hook: string
  caption: string
  hashtags: string[]
  cta: string
}

export interface Campaign {
  theme: string
  duration_days: number
  posts: InstagramPost[]
  ad_ideas: string[]
  expected_outcomes: string[]
}

export interface RunResult {
  vendor_id: number
  summary: BusinessSummary
  qualification: QualificationScore
  pitch: SalesPitch
  campaign: Campaign
}

export interface VendorListItem {
  id: number
  name: string
  category: string
  location: string
  score: number | null
  tier: LeadTier | null
  created_at: string | null
}

export interface VendorDetail {
  id: number
  name: string
  category: string
  location: string
  website: string | null
  instagram: string | null
  products: string[] | null
  latest_summary: BusinessSummary | null
  latest_qualification: QualificationScore | null
  pitches: SalesPitch[]
  campaigns: Campaign[]
  created_at: string | null
}

export interface InteractionRecord {
  id: number
  type: string
  content: Record<string, unknown> | null
  timestamp: string | null
}

export interface LastRunArtifacts {
  vendor_id: number
  summary: BusinessSummary | null
  qualification: QualificationScore | null
  pitch: SalesPitch | null
  campaign: Campaign | null
}

export interface FollowUpResponse {
  vendor_id: number
  pitch: SalesPitch
}

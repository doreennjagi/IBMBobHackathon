/**
 * Shapes returned by ``POST /api/v1/ingest/upload`` (FastAPI).
 */

export interface IngestPriceChange {
  date: string
  old_price: number
  new_price: number
  change_percent: number
  is_increase: boolean
}

export interface IngestSubscription {
  merchant: string
  billing_cycle: string
  frequency: number
  avg_amount: number
  monthly_cost: number
  first_charge: string
  last_charge: string
  price_changes: IngestPriceChange[]
  health_status: string
  confidence_score?: number
}

export interface IngestSummary {
  total_transactions: number
  subscriptions_detected: number
  total_monthly_cost: number
  date_range: { start: string | null; end: string | null }
}

export interface IngestSuccessResponse {
  success: boolean
  summary: IngestSummary
  subscriptions: IngestSubscription[]
  message: string
}

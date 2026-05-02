/**
 * Maps ingest API payloads into dashboard row + alert models.
 */

import type { PriceHikeAlert } from '@/types/alerts'
import type { IngestSubscription, IngestSuccessResponse } from '@/types/ingest'
import type { MonthlyCostPoint, PriceIncreaseMarker, SubscriptionHealth, SubscriptionRow } from '@/types/subscription'

function inferCategory(merchant: string): string {
  const m = merchant.toLowerCase()
  if (/stream|netflix|hulu|spotify|music|audio|podcast/.test(m)) {
    return 'Streaming'
  }
  if (/cloud|note|slack|notion|office|adobe|software|saas/.test(m)) {
    return 'Productivity'
  }
  if (/gym|fit|health|wellness/.test(m)) {
    return 'Health'
  }
  if (/mobile|telecom|wireless|carrier|mega/.test(m)) {
    return 'Telecom'
  }
  return 'General'
}

function asHealth(s: string): SubscriptionHealth {
  if (s === 'zombie' || s === 'escalating' || s === 'critical' || s === 'active') {
    return s
  }
  return 'active'
}

/** Build synthetic 12-month trend from last known monthly cost (demo-quality curve). */
export function buildTrendFromSubscription(sub: SubscriptionRow): {
  points: MonthlyCostPoint[]
  hikes: PriceIncreaseMarker[]
} {
  const months = ['May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr']
  const base = Math.max(1, sub.monthly_cost * 0.75)
  const points: MonthlyCostPoint[] = months.map((month, i) => ({
    month,
    amount: Math.round((base + (sub.monthly_cost - base) * (i / 11)) * 100) / 100,
  }))
  const hikes: PriceIncreaseMarker[] = []
  if (sub.price_hike_percent != null && sub.price_hike_percent > 10) {
    hikes.push({
      month: 'Mar',
      oldAmount: Math.round(base * 100) / 100,
      newAmount: sub.monthly_cost,
      increasePct: sub.price_hike_percent,
    })
  }
  return { points, hikes }
}

export function mapIngestSubscription(raw: IngestSubscription, index: number): SubscriptionRow {
  const increases = raw.price_changes?.filter((p) => p.is_increase) ?? []
  const lastHike = increases.length > 0 ? increases[increases.length - 1] : undefined
  return {
    id: `ingest-${index}-${encodeURIComponent(raw.merchant)}`,
    name: raw.merchant,
    category: inferCategory(raw.merchant),
    monthly_cost: raw.monthly_cost,
    health: asHealth(raw.health_status),
    last_billed: raw.last_charge?.slice(0, 10) ?? '',
    billing_cycle: raw.billing_cycle,
    price_hike_percent: lastHike != null ? Math.abs(lastHike.change_percent) : undefined,
  }
}

export function buildAlertsFromSubscriptions(rows: SubscriptionRow[]): PriceHikeAlert[] {
  const alerts: PriceHikeAlert[] = []
  rows.forEach((row, i) => {
    if (row.price_hike_percent != null && row.price_hike_percent > 10) {
      const prev = row.monthly_cost / (1 + row.price_hike_percent / 100)
      alerts.push({
        id: `hike-${i}-${row.id}`,
        subscriptionName: row.name,
        oldPrice: Math.round(prev * 100) / 100,
        newPrice: row.monthly_cost,
        increasePercentage: row.price_hike_percent,
      })
    }
  })
  return alerts
}

export function applyIngestResponse(res: IngestSuccessResponse): {
  subscriptions: SubscriptionRow[]
  alerts: PriceHikeAlert[]
  totalMonthly: number
  transactionCount: number
} {
  const subscriptions = res.subscriptions.map(mapIngestSubscription)
  const alerts = buildAlertsFromSubscriptions(subscriptions)
  const totalMonthly = res.summary?.total_monthly_cost ?? subscriptions.reduce((a, s) => a + s.monthly_cost, 0)
  return {
    subscriptions,
    alerts,
    totalMonthly,
    transactionCount: res.summary?.total_transactions ?? 0,
  }
}

/**
 * In-memory dashboard model: populated by CSV ingest, demo data, or cleared.
 * Not persisted — avoids storing bank-derived PII in localStorage.
 */

import { create } from 'zustand'

import type { PriceHikeAlert } from '@/types/alerts'
import type { IngestSuccessResponse } from '@/types/ingest'
import type { MonthlyCostPoint, PriceIncreaseMarker, SubscriptionRow } from '@/types/subscription'
import { applyIngestResponse, buildTrendFromSubscription } from '@/utils/mapIngestToDashboard'

export type DashboardSource = 'empty' | 'demo' | 'upload'

const DEMO_SUBS: SubscriptionRow[] = [
  {
    id: 'sub-1',
    name: 'StreamVault Plus',
    category: 'Streaming',
    monthly_cost: 16.99,
    health: 'escalating',
    last_billed: '2025-04-12',
    billing_cycle: 'monthly',
    price_hike_percent: 13.3,
  },
  {
    id: 'sub-2',
    name: 'CloudNote Pro',
    category: 'Productivity',
    monthly_cost: 11.49,
    health: 'active',
    last_billed: '2025-04-01',
    billing_cycle: 'monthly',
  },
  {
    id: 'sub-3',
    name: 'FitPulse',
    category: 'Health',
    monthly_cost: 9.99,
    health: 'zombie',
    last_billed: '2024-11-03',
    billing_cycle: 'monthly',
  },
  {
    id: 'sub-4',
    name: 'MegaMobile',
    category: 'Telecom',
    monthly_cost: 89.0,
    health: 'critical',
    last_billed: '2025-04-15',
    billing_cycle: 'monthly',
    price_hike_percent: 26.7,
  },
]

const DEMO_ALERTS: PriceHikeAlert[] = [
  {
    id: 'alert-1',
    subscriptionName: 'StreamVault Plus',
    oldPrice: 14.99,
    newPrice: 16.99,
    increasePercentage: 13.3,
  },
  {
    id: 'alert-2',
    subscriptionName: 'MegaMobile',
    oldPrice: 70.25,
    newPrice: 89.0,
    increasePercentage: 26.7,
  },
]

const DEMO_TRENDS: Record<string, { points: MonthlyCostPoint[]; hikes: PriceIncreaseMarker[] }> = {
  'sub-1': {
    points: [
      { month: 'May', amount: 12.99 },
      { month: 'Jun', amount: 12.99 },
      { month: 'Jul', amount: 12.99 },
      { month: 'Aug', amount: 12.99 },
      { month: 'Sep', amount: 12.99 },
      { month: 'Oct', amount: 12.99 },
      { month: 'Nov', amount: 12.99 },
      { month: 'Dec', amount: 12.99 },
      { month: 'Jan', amount: 12.99 },
      { month: 'Feb', amount: 12.99 },
      { month: 'Mar', amount: 14.99 },
      { month: 'Apr', amount: 16.99 },
    ],
    hikes: [{ month: 'Mar', oldAmount: 12.99, newAmount: 14.99, increasePct: 15.4 }],
  },
  'sub-2': {
    points: Array.from({ length: 12 }, (_, i) => ({
      month: ['May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr'][i] ?? 'May',
      amount: 11.49,
    })),
    hikes: [],
  },
  'sub-3': {
    points: Array.from({ length: 12 }, (_, i) => ({
      month: ['May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr'][i] ?? 'May',
      amount: 9.99,
    })),
    hikes: [],
  },
  'sub-4': {
    points: [
      { month: 'May', amount: 65 },
      { month: 'Jun', amount: 65 },
      { month: 'Jul', amount: 72 },
      { month: 'Aug', amount: 72 },
      { month: 'Sep', amount: 78 },
      { month: 'Oct', amount: 78 },
      { month: 'Nov', amount: 82 },
      { month: 'Dec', amount: 82 },
      { month: 'Jan', amount: 85 },
      { month: 'Feb', amount: 85 },
      { month: 'Mar', amount: 87 },
      { month: 'Apr', amount: 89 },
    ],
    hikes: [
      { month: 'Jul', oldAmount: 65, newAmount: 72, increasePct: 10.8 },
      { month: 'Nov', oldAmount: 78, newAmount: 82, increasePct: 5.1 },
    ],
  },
}

function trendsForRows(rows: SubscriptionRow[]): Record<string, { points: MonthlyCostPoint[]; hikes: PriceIncreaseMarker[] }> {
  const out: Record<string, { points: MonthlyCostPoint[]; hikes: PriceIncreaseMarker[] }> = {}
  rows.forEach((r) => {
    out[r.id] = buildTrendFromSubscription(r)
  })
  return out
}

interface DashboardState {
  source: DashboardSource
  subscriptions: SubscriptionRow[]
  alerts: PriceHikeAlert[]
  trends: Record<string, { points: MonthlyCostPoint[]; hikes: PriceIncreaseMarker[] }>
  lastMessage: string | null
  transactionCount: number | null
  setFromIngest: (res: IngestSuccessResponse) => void
  loadDemo: () => void
  reset: () => void
}

export const useDashboardStore = create<DashboardState>((set) => ({
  source: 'empty',
  subscriptions: [],
  alerts: [],
  trends: {},
  lastMessage: null,
  transactionCount: null,

  setFromIngest: (res) => {
    const { subscriptions, alerts, totalMonthly, transactionCount } = applyIngestResponse(res)
    set({
      source: 'upload',
      subscriptions,
      alerts,
      trends: trendsForRows(subscriptions),
      lastMessage: res.message ?? `Found ${subscriptions.length} subscriptions (${totalMonthly.toFixed(2)}/mo)`,
      transactionCount,
    })
  },

  loadDemo: () =>
    set({
      source: 'demo',
      subscriptions: DEMO_SUBS,
      alerts: DEMO_ALERTS,
      trends: DEMO_TRENDS,
      lastMessage: 'Demo data loaded — try uploading your own CSV anytime.',
      transactionCount: 48,
    }),

  reset: () =>
    set({
      source: 'empty',
      subscriptions: [],
      alerts: [],
      trends: {},
      lastMessage: null,
      transactionCount: null,
    }),
}))

/**
 * Shared subscription types for dashboard, charts, and API mapping.
 */

/** Maps to ``subscriptions.wellness_band`` and dashboard health badges. */
export type SubscriptionHealth = 'active' | 'zombie' | 'escalating' | 'critical'

/** Row shape used by the subscription DataTable and mock/API layers. */
export interface SubscriptionRow {
  id: string
  name: string
  category: string
  monthly_cost: number
  health: SubscriptionHealth
  last_billed: string
}

/** One month of spend for Carbon LineChart tabular data. */
export interface MonthlyCostPoint {
  month: string
  amount: number
}

/** Annotates a month where the subscription price increased. */
export interface PriceIncreaseMarker {
  month: string
  oldAmount: number
  newAmount: number
  increasePct: number
}

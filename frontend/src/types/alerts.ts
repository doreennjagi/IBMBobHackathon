/**
 * High-priority price hike alerts for banners and notifications.
 */

export interface PriceHikeAlert {
  id: string
  subscriptionName: string
  oldPrice: number
  newPrice: number
  increasePercentage: number
}

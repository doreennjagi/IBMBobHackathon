/**
 * AlertBanner
 *
 * Surfaces high-priority price hike alerts with a clear call-to-action.
 * Parent supplies alert rows (e.g. from API); this component stays presentational.
 */

import { InlineNotification, Button, Stack } from '@carbon/react'

import type { PriceHikeAlert } from '@/types/alerts'

export interface AlertBannerProps {
  alerts: PriceHikeAlert[]
  /** Fired when user chooses to act on a specific alert (navigate, open modal, etc.). */
  onTakeAction?: (alert: PriceHikeAlert) => void
}

export default function AlertBanner({ alerts, onTakeAction }: AlertBannerProps) {
  if (alerts.length === 0) {
    return null
  }

  return (
    <div className="alert-banner" role="region" aria-label="High priority price alerts">
      <Stack gap={5}>
        {alerts.map((alert) => (
          <Stack key={alert.id} orientation="horizontal" gap={5}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <InlineNotification
                kind="warning"
                lowContrast
                title={`Price hike: ${alert.subscriptionName}`}
                subtitle={`Was ${alert.oldPrice.toLocaleString(undefined, {
                  style: 'currency',
                  currency: 'USD',
                })} → now ${alert.newPrice.toLocaleString(undefined, {
                  style: 'currency',
                  currency: 'USD',
                })} (${alert.increasePercentage.toFixed(1)}% increase).`}
                hideCloseButton
              />
            </div>
            <Button
              kind="primary"
              size="md"
              aria-label={`Take action on price hike for ${alert.subscriptionName}`}
              onClick={() => onTakeAction?.(alert)}
            >
              Take Action
            </Button>
          </Stack>
        ))}
      </Stack>
    </div>
  )
}

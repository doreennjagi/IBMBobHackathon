/**
 * Price-hike alert stack: accent rail, pulsing icon, pricing row, overpay estimate, CTAs, dismiss with motion exit.
 */

import { useMemo } from 'react'
import styled from '@emotion/styled'
import { AnimatePresence, motion } from 'framer-motion'

import type { PriceHikeAlert } from '@/types/alerts'

export interface AlertBannerProps {
  alerts: PriceHikeAlert[]
  dismissedIds: ReadonlySet<string>
  onDismiss: (id: string) => void
  onGenerateResponse?: (alert: PriceHikeAlert) => void
  onTakeAction?: (alert: PriceHikeAlert) => void
}

const Stack = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`

const Card = styled(motion.article)`
  display: grid;
  grid-template-columns: 6px 1fr auto;
  gap: 0 0.75rem;
  align-items: stretch;
  border-radius: var(--sl-radius);
  background: var(--sl-surface);
  border: 2px solid var(--sl-line);
  box-shadow: var(--sl-shadow-sm);
  overflow: hidden;
  position: relative;
`

const Rail = styled.div`
  background: linear-gradient(180deg, #ff6b6b, #ff922b);
  min-height: 100%;
`

const Body = styled.div`
  padding: 0.85rem 0 0.85rem 0;
  min-width: 0;
`

const Icon = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.75rem;
  height: 1.75rem;
  margin-right: 0.35rem;
  animation: sl-pulse-warn 1.6s ease-in-out infinite;
  @keyframes sl-pulse-warn {
    0%,
    100% {
      transform: scale(1);
      opacity: 1;
    }
    50% {
      transform: scale(1.08);
      opacity: 0.85;
    }
  }
`

const TitleRow = styled.div`
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  font-weight: 700;
  font-size: 1rem;
  color: var(--sl-text);
`

const PriceRow = styled.p`
  margin: 0.35rem 0 0;
  font-size: 0.9375rem;
  color: var(--sl-text-muted);
`

const Badge = styled.span`
  display: inline-block;
  margin-left: 0.5rem;
  padding: 0.15rem 0.45rem;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 700;
  background: rgba(255, 107, 107, 0.18);
  color: var(--sl-hike);
`

const Sub = styled.p`
  margin: 0.4rem 0 0;
  font-size: 0.8125rem;
  color: var(--sl-text-muted);
`

const Actions = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 0.85rem 0.85rem 0.85rem 0;
  align-items: stretch;
  justify-content: center;
`

const GenBtn = styled.button`
  border: 2px solid var(--sl-line);
  border-radius: var(--sl-radius-pill);
  padding: 0.5rem 0.8rem;
  font-weight: 800;
  font-size: 0.75rem;
  cursor: pointer;
  color: var(--sl-ticker-fg);
  white-space: nowrap;
  min-height: 44px;
  box-shadow: var(--sl-shadow-sm);
`

const IconBtn = styled.button`
  border: none;
  background: transparent;
  color: var(--sl-text-muted);
  cursor: pointer;
  font-size: 1.1rem;
  line-height: 1;
  padding: 0.25rem;
  border-radius: 6px;
  &:hover {
    color: var(--sl-hike);
    background: rgba(255, 107, 107, 0.08);
  }
`

function serviceEmoji(name: string): string {
  const n = name.toLowerCase()
  if (n.includes('stream') || n.includes('vault')) return '📺'
  if (n.includes('mobile') || n.includes('mega')) return '📱'
  return '🔔'
}

function overpayEstimate(alert: PriceHikeAlert): number {
  const delta = alert.newPrice - alert.oldPrice
  return Math.max(0, delta * 6)
}

export default function AlertBanner({ alerts, dismissedIds, onDismiss, onGenerateResponse, onTakeAction }: AlertBannerProps) {
  const visible = useMemo(() => alerts.filter((a) => !dismissedIds.has(a.id)), [alerts, dismissedIds])

  if (visible.length === 0) {
    return null
  }

  return (
    <Stack role="region" aria-label="Price hike alerts">
      <AnimatePresence mode="popLayout">
        {visible.map((alert) => (
          <Card
            key={alert.id}
            layout
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 14, transition: { duration: 0.28 } }}
            transition={{ type: 'spring', stiffness: 420, damping: 32 }}
          >
            <Rail aria-hidden />
            <Body>
              <TitleRow>
                <span style={{ display: 'inline-flex', alignItems: 'center' }}>
                  <Icon aria-hidden>{serviceEmoji(alert.subscriptionName)}</Icon>
                  {alert.subscriptionName}
                </span>
                <Badge>+{alert.increasePercentage.toFixed(1)}%</Badge>
              </TitleRow>
              <PriceRow>
                {alert.oldPrice.toLocaleString(undefined, { style: 'currency', currency: 'USD' })} →{' '}
                {alert.newPrice.toLocaleString(undefined, { style: 'currency', currency: 'USD' })}
              </PriceRow>
              <Sub>You&apos;ve overpaid ~{overpayEstimate(alert).toLocaleString(undefined, { style: 'currency', currency: 'USD' })} since the hike (est.).</Sub>
            </Body>
            <Actions>
              <GenBtn
                type="button"
                style={{ background: 'var(--sl-coral)' }}
                onClick={() => onGenerateResponse?.(alert)}
              >
                Generate response
              </GenBtn>
              <GenBtn type="button" style={{ background: 'var(--sl-line)' }} onClick={() => onTakeAction?.(alert)}>
                Take action
              </GenBtn>
              <IconBtn type="button" aria-label={`Dismiss alert for ${alert.subscriptionName}`} onClick={() => onDismiss(alert.id)}>
                ✕
              </IconBtn>
            </Actions>
          </Card>
        ))}
      </AnimatePresence>
    </Stack>
  )
}

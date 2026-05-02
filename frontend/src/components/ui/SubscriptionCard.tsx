/**
 * Grid subscription card — reference UI: left accent, status pill, sparkline, Manage vs Cancel/Negotiate.
 */

import styled from '@emotion/styled'
import { motion } from 'framer-motion'

import type { MonthlyCostPoint } from '@/types/subscription'
import type { SubscriptionRow } from '@/types/subscription'

import { Sparkline } from './Sparkline'

export interface SubscriptionCardProps {
  row: SubscriptionRow
  points: MonthlyCostPoint[]
  selected: boolean
  onSelect: () => void
  onCancel: () => void
  onNegotiate: () => void
  index: number
}

function categoryEmoji(category: string): string {
  const c = category.toLowerCase()
  if (c.includes('stream')) return '📺'
  if (c.includes('music')) return '🎵'
  if (c.includes('cloud') || c.includes('storage')) return '☁️'
  if (c.includes('health') || c.includes('fit')) return '💪'
  if (c.includes('telecom') || c.includes('mobile')) return '📱'
  if (c.includes('productivity')) return '📝'
  return '🧾'
}

function estimateOldMonthly(row: SubscriptionRow): number | null {
  if (row.price_hike_percent == null || row.price_hike_percent <= 10) {
    return null
  }
  return row.monthly_cost / (1 + row.price_hike_percent / 100)
}

const Root = styled(motion.article)<{ $selected: boolean; $hike: boolean; $zombie: boolean }>`
  position: relative;
  border-radius: var(--sl-radius);
  padding: 1rem 1.1rem 1.1rem;
  cursor: pointer;
  overflow: hidden;
  border: 2px solid var(--sl-line);
  background: ${({ $hike, $zombie }) => {
    if ($hike) return 'var(--sl-danger-bg)'
    if ($zombie) return 'var(--sl-surface-3)'
    return 'var(--sl-surface)'
  }};
  box-shadow: ${({ $selected }) => ($selected ? 'var(--sl-shadow-md)' : 'var(--sl-shadow-sm)')};
  transition: transform 0.15s ease;

  &:hover {
    transform: translate(-2px, -2px);
  }

  &:focus-visible {
    outline: 3px solid var(--sl-coral);
    outline-offset: 2px;
  }
`

const Top = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 0.5rem;
`

const IconTitle = styled.div`
  display: flex;
  gap: 0.65rem;
  align-items: flex-start;
  min-width: 0;
`

const IconBox = styled.div`
  width: 2.65rem;
  height: 2.65rem;
  border-radius: 12px;
  border: 2px solid var(--sl-line);
  background: var(--sl-surface-2);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.35rem;
  flex-shrink: 0;
`

const NameBlock = styled.div`
  min-width: 0;
`

const Title = styled.h3`
  margin: 0;
  font-size: 1.05rem;
  font-weight: 700;
  color: var(--sl-text);
`

const Cat = styled.p`
  margin: 0.2rem 0 0;
  font-size: 0.8125rem;
  color: var(--sl-text-muted);
`

const Badge = styled.span<{ $tone: 'hike' | 'active' | 'zombie' | 'other' }>`
  flex-shrink: 0;
  padding: 0.2rem 0.55rem;
  border-radius: 999px;
  font-size: 0.6875rem;
  font-weight: 700;
  ${({ $tone }) => {
    if ($tone === 'hike') {
      return `background: rgba(255,107,107,0.18); color: var(--sl-hike);`
    }
    if ($tone === 'active') {
      return `background: rgba(81,207,102,0.16); color: #2b8a3e;`
    }
    if ($tone === 'zombie') {
      return `background: rgba(255,184,77,0.22); color: #d9480f;`
    }
    return `background: rgba(116,143,252,0.15); color: #3b5bdb;`
  }}
`

const PriceRow = styled.div`
  margin-top: 0.65rem;
  font-family: 'IBM Plex Mono', ui-monospace, monospace;
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 0.35rem;
`

const OldP = styled.span`
  text-decoration: line-through;
  color: var(--sl-text-muted);
  font-size: 0.875rem;
`

const NewP = styled.span`
  font-size: 1.35rem;
  font-weight: 700;
  color: var(--sl-text);
`

const SparkWrap = styled.div`
  margin-top: 0.5rem;
  max-width: 100%;
`

const Footer = styled.div`
  margin-top: 0.5rem;
  font-size: 0.75rem;
  color: var(--sl-text-muted);
`

const Actions = styled.div`
  display: flex;
  gap: 0.5rem;
  margin-top: 0.85rem;
`

const BtnManage = styled.button`
  flex: 1;
  min-height: 48px;
  border: 2px solid var(--sl-line);
  border-radius: var(--sl-radius-pill);
  font-weight: 800;
  font-size: 0.8125rem;
  cursor: pointer;
  background: var(--sl-manage-bg);
  color: var(--sl-ink);
  box-shadow: var(--sl-shadow-sm);
  &:hover {
    background: var(--sl-manage-hover);
  }
`

const BtnCancel = styled.button`
  flex: 1;
  min-height: 48px;
  border: 2px solid var(--sl-line);
  border-radius: var(--sl-radius-pill);
  font-weight: 800;
  font-size: 0.75rem;
  cursor: pointer;
  color: var(--sl-ticker-fg);
  background: var(--sl-coral);
  box-shadow: var(--sl-shadow-sm);
`

const BtnNeg = styled.button`
  flex: 1;
  min-height: 48px;
  border: 2px solid var(--sl-line);
  border-radius: var(--sl-radius-pill);
  font-weight: 800;
  font-size: 0.75rem;
  cursor: pointer;
  color: var(--sl-ticker-fg);
  background: var(--sl-line);
  box-shadow: var(--sl-shadow-sm);
`

function badgeTone(row: SubscriptionRow, hike: boolean): 'hike' | 'active' | 'zombie' | 'other' {
  if (hike) return 'hike'
  if (row.health === 'active') return 'active'
  if (row.health === 'zombie') return 'zombie'
  return 'other'
}

function badgeLabel(row: SubscriptionRow, hike: boolean): string {
  if (hike) return `+${row.price_hike_percent?.toFixed(1)}%`
  if (row.health === 'zombie') return 'Zombie'
  if (row.health === 'active') return 'Active'
  return row.health.charAt(0).toUpperCase() + row.health.slice(1)
}

export function SubscriptionCard({ row, points, selected, onSelect, onCancel, onNegotiate, index }: SubscriptionCardProps) {
  const hike = row.price_hike_percent != null && row.price_hike_percent > 10
  const oldP = estimateOldMonthly(row)
  const zombie = row.health === 'zombie'
  const accent = hike ? 'var(--sl-coral)' : zombie ? '#f59e0b' : 'var(--sl-teal)'
  const manageLabel = zombie ? 'Review' : 'Manage'

  return (
    <Root
      $selected={selected}
      $hike={hike}
      $zombie={zombie}
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
      role="button"
      tabIndex={0}
      aria-pressed={selected}
      aria-label={`${row.name}`}
      className="sl-sub-card-enter"
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onSelect()
        }
      }}
    >
      <Top>
        <IconTitle>
          <IconBox aria-hidden>{categoryEmoji(row.category)}</IconBox>
          <NameBlock>
            <Title>{row.name}</Title>
            <Cat>{row.category}</Cat>
          </NameBlock>
        </IconTitle>
        <Badge $tone={badgeTone(row, hike)}>{badgeLabel(row, hike)}</Badge>
      </Top>
      <PriceRow>
        {hike && oldP != null ? (
          <>
            <OldP>{oldP.toLocaleString(undefined, { style: 'currency', currency: 'USD' })}/mo</OldP>
            <NewP>{row.monthly_cost.toLocaleString(undefined, { style: 'currency', currency: 'USD' })}/mo</NewP>
          </>
        ) : (
          <NewP>{row.monthly_cost.toLocaleString(undefined, { style: 'currency', currency: 'USD' })}/mo</NewP>
        )}
      </PriceRow>
      <SparkWrap>
        <Sparkline points={points} label={row.name} accent={accent} />
      </SparkWrap>
      <Footer>Last charge · {row.last_billed}</Footer>
      <Actions onClick={(e) => e.stopPropagation()}>
        {hike ? (
          <>
            <BtnCancel type="button" className="sl-ripple-host" onClick={onCancel}>
              Cancel
            </BtnCancel>
            <BtnNeg type="button" className="sl-ripple-host" onClick={onNegotiate}>
              Negotiate
            </BtnNeg>
          </>
        ) : (
          <BtnManage type="button" className="sl-ripple-host" onClick={onSelect}>
            {manageLabel}
          </BtnManage>
        )}
      </Actions>
    </Root>
  )
}

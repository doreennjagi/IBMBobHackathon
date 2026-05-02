/**
 * Priority hike row — white card, black border, coral / black CTAs.
 */

import styled from '@emotion/styled'
import { motion } from 'framer-motion'

import type { MonthlyCostPoint } from '@/types/subscription'
import type { SubscriptionRow } from '@/types/subscription'

import { Sparkline } from './Sparkline'

export interface PriorityHikeCardProps {
  row: SubscriptionRow
  points: MonthlyCostPoint[]
  oldMonthlyEstimate: number
  overpaidEstimate: number
  onCancellationLetter: () => void
  onNegotiate: () => void
  index: number
}

const Root = styled(motion.article)`
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: 1rem 1.25rem;
  align-items: center;
  padding: 1rem 1.15rem;
  border-radius: var(--sl-radius);
  background: var(--sl-surface);
  border: 2px solid var(--sl-line);
  box-shadow: var(--sl-shadow-sm);

  @media (max-width: 671px) {
    grid-template-columns: 1fr;
  }
`

const IconBox = styled.div`
  width: 3rem;
  height: 3rem;
  border-radius: 12px;
  border: 2px solid var(--sl-line);
  background: var(--sl-surface-2);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
`

const Mid = styled.div`
  min-width: 0;
`

const Title = styled.h3`
  margin: 0;
  font-size: 1.05rem;
  font-weight: 800;
  color: var(--sl-ink);
`

const Cat = styled.p`
  margin: 0.15rem 0 0;
  font-size: 0.8125rem;
  color: var(--sl-muted);
`

const PriceBlock = styled.div`
  margin-top: 0.45rem;
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 0.35rem 0.55rem;
  font-family: var(--sl-font-mono);
`

const OldP = styled.span`
  text-decoration: line-through;
  color: var(--sl-muted);
  font-size: 0.9rem;
`

const NewP = styled.span`
  font-size: 1.15rem;
  font-weight: 800;
`

const Pill = styled.span`
  padding: 0.1rem 0.45rem;
  border-radius: var(--sl-radius-pill);
  font-size: 0.7rem;
  font-weight: 800;
  border: 2px solid var(--sl-line);
  background: var(--sl-summary-a);
  color: var(--sl-coral);
`

const Over = styled.p`
  margin: 0.3rem 0 0;
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--sl-coral);
`

const SparkWrap = styled.div`
  max-width: 200px;
  margin-top: 0.3rem;
`

const Actions = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
  min-width: 9.5rem;

  @media (max-width: 671px) {
    flex-direction: row;
    min-width: 0;
    width: 100%;
  }
`

const BtnLetter = styled.button`
  border: 2px solid var(--sl-line);
  border-radius: var(--sl-radius-pill);
  padding: 0.55rem 0.85rem;
  font-weight: 800;
  font-size: 0.75rem;
  cursor: pointer;
  color: var(--sl-ticker-fg);
  background: var(--sl-coral);
  box-shadow: var(--sl-shadow-sm);
  min-height: 44px;
`

const BtnNeg = styled.button`
  border: 2px solid var(--sl-line);
  border-radius: var(--sl-radius-pill);
  padding: 0.55rem 0.85rem;
  font-weight: 800;
  font-size: 0.75rem;
  cursor: pointer;
  color: var(--sl-ticker-fg);
  background: var(--sl-line);
  box-shadow: var(--sl-shadow-sm);
  min-height: 44px;
`

function categoryEmoji(category: string): string {
  const c = category.toLowerCase()
  if (c.includes('stream')) return '📺'
  if (c.includes('telecom') || c.includes('mobile')) return '📱'
  return '🧾'
}

export function PriorityHikeCard({
  row,
  points,
  oldMonthlyEstimate,
  overpaidEstimate,
  onCancellationLetter,
  onNegotiate,
  index,
}: PriorityHikeCardProps) {
  const pct = row.price_hike_percent ?? 0

  return (
    <Root layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}>
      <IconBox aria-hidden>{categoryEmoji(row.category)}</IconBox>
      <Mid>
        <Title>{row.name}</Title>
        <Cat>{row.category}</Cat>
        <PriceBlock>
          <OldP>{oldMonthlyEstimate.toLocaleString(undefined, { style: 'currency', currency: 'USD' })}/mo</OldP>
          <NewP>{row.monthly_cost.toLocaleString(undefined, { style: 'currency', currency: 'USD' })}/mo</NewP>
          <Pill>+{pct.toFixed(1)}%</Pill>
        </PriceBlock>
        <Over>
          You&apos;ve overpaid ~{overpaidEstimate.toLocaleString(undefined, { style: 'currency', currency: 'USD' })} since
          the hike (est.)
        </Over>
        <SparkWrap>
          <Sparkline points={points} label={row.name} accent="var(--sl-coral)" />
        </SparkWrap>
      </Mid>
      <Actions>
        <BtnLetter type="button" onClick={onCancellationLetter}>
          Cancellation letter
        </BtnLetter>
        <BtnNeg type="button" onClick={onNegotiate}>
          Negotiate
        </BtnNeg>
      </Actions>
    </Root>
  )
}

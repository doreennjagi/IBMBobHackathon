/**
 * KPI cards — neo-brutalist: thick black border, hard offset shadow on recoverable.
 */

import styled from '@emotion/styled'
import { motion } from 'framer-motion'

import type { StatVariant } from './theme'

export interface StatCardProps {
  label: string
  value: string
  variant: StatVariant
  icon?: string
  subLabel?: string
  metaLine?: string | null
  footnote?: string | null
  appearance?: 'soft' | 'solid'
  ariaLabel: string
  className?: string
}

const accentBorder: Record<StatVariant, string> = {
  purple: '4px solid #ff4d3d',
  teal: '4px solid #16a34a',
  gold: 'none',
}

const Shell = styled(motion.article)<{ $variant: StatVariant; $yellow: boolean }>`
  position: relative;
  border-radius: var(--sl-radius);
  padding: 1.1rem 1.2rem 1.15rem;
  min-height: 7.5rem;
  border: 2px solid var(--sl-line);
  background: ${({ $yellow }) => ($yellow ? 'var(--sl-yellow-card)' : 'var(--sl-surface)')};
  box-shadow: ${({ $yellow }) => ($yellow ? 'var(--sl-shadow-lg)' : 'var(--sl-shadow-sm)')};
  border-left: ${({ $variant, $yellow }) => ($yellow ? '2px solid var(--sl-line)' : accentBorder[$variant])};
  transition: transform 0.15s ease;

  &:hover {
    transform: translate(-2px, -2px);
  }
`

const LabelRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.65rem;
  font-weight: 800;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--sl-muted);
`

const ValueText = styled.p`
  margin: 0.35rem 0 0;
  font-family: var(--sl-font-mono);
  font-size: clamp(1.65rem, 3.5vw, 2.35rem);
  font-weight: 700;
  line-height: 1.05;
  color: var(--sl-ink);
`

const Sub = styled.p`
  margin: 0.15rem 0 0;
  font-size: 0.9375rem;
  font-weight: 600;
  color: var(--sl-muted);
`

const Meta = styled.p`
  margin: 0.35rem 0 0;
  font-size: 0.8125rem;
  color: var(--sl-muted);
`

const FootStyled = styled.p`
  margin: 0.45rem 0 0;
  font-size: 0.8125rem;
  font-weight: 700;
  color: var(--sl-coral);
`

export function StatCard({
  label,
  value,
  variant,
  icon,
  subLabel,
  metaLine,
  footnote,
  appearance,
  ariaLabel,
  className,
}: StatCardProps) {
  const yellow = (appearance ?? (variant === 'gold' ? 'solid' : 'soft')) === 'solid' || variant === 'gold'

  return (
    <Shell
      className={className}
      $variant={variant}
      $yellow={yellow}
      role="region"
      aria-label={ariaLabel}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
    >
      <LabelRow>
        {icon ? <span aria-hidden>{icon}</span> : null}
        {label}
      </LabelRow>
      <ValueText aria-live="polite">{value}</ValueText>
      {subLabel ? <Sub>{subLabel}</Sub> : null}
      {metaLine ? <Meta>{metaLine}</Meta> : null}
      {footnote ? <FootStyled>{footnote}</FootStyled> : null}
    </Shell>
  )
}

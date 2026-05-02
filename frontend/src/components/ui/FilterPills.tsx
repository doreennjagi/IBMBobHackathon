/**
 * Pill filters — active: black fill; inactive: white + black border + optional status dot.
 */

import styled from '@emotion/styled'

import type { DashboardPillId } from './theme'

export interface FilterPillItem {
  id: DashboardPillId
  label: string
  dot?: 'coral' | 'yellow' | 'green'
}

export interface FilterPillsProps {
  items: FilterPillItem[]
  activeId: DashboardPillId
  onChange: (id: DashboardPillId) => void
  'aria-label'?: string
}

const Row = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
`

const dotColor = (d?: FilterPillItem['dot']) => {
  if (d === 'coral') return '#ff4d3d'
  if (d === 'yellow') return '#eab308'
  if (d === 'green') return '#16a34a'
  return 'transparent'
}

const Pill = styled.button<{ $active: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  cursor: pointer;
  border-radius: var(--sl-radius-pill);
  padding: 0.45rem 0.95rem;
  font-size: 0.875rem;
  font-weight: 800;
  font-family: inherit;
  min-height: 44px;
  border: 2px solid var(--sl-line);
  transition: transform 0.12s ease;

  ${({ $active }) =>
    $active
      ? `
    background: var(--sl-ticker-bg);
    color: var(--sl-ticker-fg);
    box-shadow: var(--sl-shadow-sm);
  `
      : `
    background: var(--sl-surface);
    color: var(--sl-ink);
    box-shadow: var(--sl-shadow-sm);
  `}

  &:hover {
    transform: translate(-1px, -1px);
  }

  &:focus-visible {
    outline: 3px solid var(--sl-coral);
    outline-offset: 2px;
  }
`

const Dot = styled.span<{ $c: string }>`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: ${({ $c }) => $c};
  border: 1px solid var(--sl-line);
  flex-shrink: 0;
`

export function FilterPills({ items, activeId, onChange, 'aria-label': ariaLabel }: FilterPillsProps) {
  return (
    <Row role="tablist" aria-label={ariaLabel ?? 'Subscription filters'}>
      {items.map((item) => {
        const active = activeId === item.id
        const c = dotColor(item.dot)
        return (
          <Pill
            key={item.id}
            type="button"
            role="tab"
            aria-selected={active}
            $active={active}
            onClick={() => onChange(item.id)}
          >
            {!active && item.dot ? <Dot $c={c} aria-hidden /> : null}
            {item.label}
          </Pill>
        )
      })}
    </Row>
  )
}

export interface CategoryPillsProps {
  items: { id: string; label: string }[]
  activeId: string
  onChange: (id: string) => void
}

export function CategoryPills({ items, activeId, onChange }: CategoryPillsProps) {
  return (
    <Row role="tablist" aria-label="Category filters">
      {items.map((item) => (
        <Pill key={item.id} type="button" role="tab" aria-selected={activeId === item.id} $active={activeId === item.id} onClick={() => onChange(item.id)}>
          {item.label}
        </Pill>
      ))}
    </Row>
  )
}

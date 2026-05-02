/**
 * Surface primitive — neo tile (black border, hard shadow).
 */

import styled from '@emotion/styled'

import type { CardVariant } from './theme'

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant
  children: React.ReactNode
}

const variantStyles: Record<CardVariant, string> = {
  default: `
    background: var(--sl-surface);
    box-shadow: var(--sl-shadow-sm);
    border: 2px solid var(--sl-line);
  `,
  highlighted: `
    background: var(--sl-surface);
    box-shadow: var(--sl-shadow-md);
    border: 2px solid #0d9488;
  `,
  danger: `
    background: var(--sl-danger-bg);
    box-shadow: var(--sl-shadow-sm);
    border: 2px solid var(--sl-coral);
  `,
}

const Root = styled.div<{ $variant: CardVariant }>`
  border-radius: var(--sl-radius);
  transition: transform 0.15s ease;
  ${({ $variant }) => variantStyles[$variant]}

  &:hover {
    transform: translate(-1px, -1px);
  }
`

export function Card({ variant = 'default', children, ...rest }: CardProps) {
  return (
    <Root $variant={variant} {...rest}>
      {children}
    </Root>
  )
}

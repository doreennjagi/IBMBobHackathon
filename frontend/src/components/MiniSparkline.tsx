/**
 * Tiny inline SVG trend for table rows (not a full chart; complements Carbon DataTable).
 */

import type { MonthlyCostPoint } from '@/types/subscription'

export interface MiniSparklineProps {
  points: MonthlyCostPoint[]
  /** Accessible label, e.g. subscription name. */
  label: string
}

export default function MiniSparkline({ points, label }: MiniSparklineProps) {
  if (points.length < 2) {
    return <span className="cds--type-helper-text-01">—</span>
  }
  const w = 72
  const h = 24
  const values = points.map((p) => p.amount)
  const min = Math.min(...values)
  const max = Math.max(...values)
  const span = max - min || 1
  const pts = values
    .map((v, i) => {
      const x = (i / (values.length - 1)) * w
      const y = h - ((v - min) / span) * (h - 4) - 2
      return `${x},${y}`
    })
    .join(' ')

  return (
    <svg
      width={w}
      height={h}
      viewBox={`0 0 ${w} ${h}`}
      role="img"
      aria-label={`${label} cost trend over ${points.length} months`}
      className="mini-sparkline"
    >
      <title>{`${label} trend`}</title>
      <polyline fill="none" stroke="var(--cds-link-primary, #0f62fe)" strokeWidth="2" points={pts} />
    </svg>
  )
}

/**
 * Compact area trend with gradient fill, draw-in animation, and hover tooltip for monthly values.
 */

import { useId, useMemo, useState } from 'react'
import styled from '@emotion/styled'

import type { MonthlyCostPoint } from '@/types/subscription'

export interface SparklineProps {
  points: MonthlyCostPoint[]
  /** Accessible name for the chart. */
  label: string
  /** Stroke / top gradient hue (CSS color). */
  accent?: string
  className?: string
}

const Wrap = styled.div`
  position: relative;
  width: 100%;
  max-width: 200px;
`

const SvgRoot = styled.svg`
  display: block;
  width: 100%;
  height: 48px;
  overflow: visible;
`

const Tip = styled.div`
  position: absolute;
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%) translateY(-4px);
  padding: 0.25rem 0.5rem;
  font-size: 0.75rem;
  font-family: 'IBM Plex Mono', ui-monospace, monospace;
  background: var(--sl-card-bg);
  color: var(--sl-text);
  border: 1px solid var(--sl-border);
  border-radius: 6px;
  box-shadow: var(--sl-shadow-card);
  white-space: nowrap;
  pointer-events: none;
  z-index: 2;
`

export function Sparkline({ points, label, accent = 'var(--sl-active)', className }: SparklineProps) {
  const gid = useId().replace(/:/g, '')
  const [hover, setHover] = useState<{ m: string; a: number; leftPct: number } | null>(null)

  const { pathLine, pathArea, pts, w, h } = useMemo(() => {
    const w = 180
    const h = 48
    if (points.length < 2) {
      return { pathLine: '', pathArea: '', pts: [] as { x: number; y: number; m: string; a: number }[], w, h }
    }
    const vals = points.map((p) => p.amount)
    const min = Math.min(...vals)
    const max = Math.max(...vals)
    const span = max - min || 1
    const pad = 4
    const pts = points.map((p, i) => {
      const x = pad + (i / (points.length - 1)) * (w - pad * 2)
      const y = h - pad - ((p.amount - min) / span) * (h - pad * 2)
      return { x, y, m: p.month, a: p.amount }
    })
    const line = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')
    const area = `${line} L ${pts[pts.length - 1]?.x ?? 0} ${h} L ${pts[0]?.x ?? 0} ${h} Z`
    return { pathLine: line, pathArea: area, pts, w, h }
  }, [points])

  if (points.length < 2) {
    return <span className="cds--type-helper-text-01">—</span>
  }

  return (
    <Wrap
      className={className}
      onMouseLeave={() => setHover(null)}
      role="img"
      aria-label={`${label} cost trend`}
    >
      {hover ? (
        <Tip style={{ left: `${hover.leftPct}%`, transform: 'translateX(-50%) translateY(-4px)' }}>
          {hover.m}:{' '}
          {hover.a.toLocaleString(undefined, {
            style: 'currency',
            currency: 'USD',
          })}
        </Tip>
      ) : null}
      <div className="sl-spark-draw-wrap">
        <SvgRoot viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
          <title>{label} trend</title>
          <defs>
            <linearGradient id={`${gid}-fill`} x1="0" y1="1" x2="0" y2="0">
              <stop offset="0%" stopColor={accent} stopOpacity="0.12" />
              <stop offset="100%" stopColor={accent} stopOpacity="0.55" />
            </linearGradient>
            <linearGradient id={`${gid}-stroke`} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor={accent} stopOpacity="0.85" />
              <stop offset="100%" stopColor={accent} />
            </linearGradient>
          </defs>
          <path d={pathArea} fill={`url(#${gid}-fill)`} stroke="none" />
          <path
            d={pathLine}
            fill="none"
            stroke={`url(#${gid}-stroke)`}
            strokeWidth={2.25}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {pts.map((p) => (
            <rect
              key={p.m}
              x={p.x - 10}
              y={0}
              width={20}
              height={h}
              fill="transparent"
              style={{ cursor: 'crosshair' }}
              onMouseEnter={() =>
                setHover({
                  m: p.m,
                  a: p.a,
                  leftPct: (p.x / w) * 100,
                })
              }
            />
          ))}
        </SvgRoot>
      </div>
    </Wrap>
  )
}

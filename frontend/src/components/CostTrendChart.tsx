/**
 * Cost trend — inline SVG line chart (no Carbon charts).
 */

import { useCallback, useMemo, useState } from 'react'

import { useTheme } from '@/theme/useTheme'
import type { MonthlyCostPoint, PriceIncreaseMarker } from '@/types/subscription'

export interface CostTrendChartProps {
  subscriptionName: string
  points: MonthlyCostPoint[]
  priceIncreases: PriceIncreaseMarker[]
}

function readCssVar(name: string, fallback: string): string {
  if (typeof document === 'undefined') {
    return fallback
  }
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim()
  return v || fallback
}

function downloadTrendPng(points: MonthlyCostPoint[], title: string) {
  const w = 880
  const h = 360
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  if (!ctx || points.length < 2) {
    return
  }
  ctx.fillStyle = readCssVar('--sl-bg', '#fdf8f1')
  ctx.fillRect(0, 0, w, h)
  ctx.strokeStyle = readCssVar('--sl-line', '#0a0a0a')
  ctx.lineWidth = 3
  const vals = points.map((p) => p.amount)
  const min = Math.min(...vals)
  const max = Math.max(...vals)
  const span = max - min || 1
  const pad = 48
  ctx.beginPath()
  points.forEach((p, i) => {
    const x = pad + (i / (points.length - 1)) * (w - pad * 2)
    const y = h - pad - ((p.amount - min) / span) * (h - pad * 2)
    if (i === 0) {
      ctx.moveTo(x, y)
    } else {
      ctx.lineTo(x, y)
    }
  })
  ctx.stroke()
  ctx.fillStyle = readCssVar('--sl-ink', '#0a0a0a')
  ctx.font = '600 16px IBM Plex Sans, sans-serif'
  ctx.fillText(title, pad, 28)
  canvas.toBlob((blob) => {
    if (!blob) {
      return
    }
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${title.replace(/\s+/g, '_')}_trend.png`
    a.click()
    URL.revokeObjectURL(url)
  }, 'image/png')
}

export default function CostTrendChart({ subscriptionName, points, priceIncreases }: CostTrendChartProps) {
  const [mode, setMode] = useState<'line' | 'bars'>('line')
  const { theme } = useTheme()

  const chart = useMemo(() => {
    const line = readCssVar('--sl-line', '#0a0a0a')
    const surface = readCssVar('--sl-surface', '#ffffff')
    const ink = readCssVar('--sl-ink', '#0a0a0a')
    const coral = readCssVar('--sl-coral', '#ff4d3d')
    const summaryA = readCssVar('--sl-summary-a', '#ffe8e8')
    const borderRgb = theme === 'dark' ? '255,255,255' : '10,10,10'
    return { line, surface, ink, coral, summaryA, borderRgb }
  }, [theme])

  const { pathD, lastX, lastY, w, h, pad } = useMemo(() => {
    const width = 560
    const height = 200
    const p = 28
    if (points.length < 2) {
      return { pathD: '', lastX: p, lastY: height / 2, w: width, h: height, pad: p }
    }
    const vals = points.map((x) => x.amount)
    const min = Math.min(...vals)
    const max = Math.max(...vals)
    const span = max - min || 1
    const innerW = width - p * 2
    const innerH = height - p * 2
    const d = points
      .map((pt, i) => {
        const x = p + (i / (points.length - 1)) * innerW
        const y = p + innerH - ((pt.amount - min) / span) * innerH
        return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`
      })
      .join(' ')
    const lx = p + innerW
    const ly = p + innerH - ((points[points.length - 1].amount - min) / span) * innerH
    return { pathD: d, lastX: lx, lastY: ly, w: width, h: height, pad: p }
  }, [points])

  const onPng = useCallback(() => {
    downloadTrendPng(points, subscriptionName)
  }, [points, subscriptionName])

  if (points.length < 2) {
    return (
      <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--sl-muted)' }}>Not enough history to chart yet.</p>
    )
  }

  const { line, surface, ink, coral, summaryA, borderRgb } = chart

  return (
    <div className="cost-trend-chart">
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center', marginBottom: '0.75rem' }}>
        <div style={{ display: 'inline-flex', border: `2px solid ${line}`, borderRadius: 999, overflow: 'hidden' }}>
          <button
            type="button"
            onClick={() => setMode('line')}
            style={{
              border: 'none',
              padding: '0.35rem 0.85rem',
              fontWeight: 800,
              fontSize: '0.75rem',
              cursor: 'pointer',
              background: mode === 'line' ? line : surface,
              color: mode === 'line' ? readCssVar('--sl-ticker-fg', '#fff') : ink,
            }}
          >
            Line
          </button>
          <button
            type="button"
            onClick={() => setMode('bars')}
            style={{
              border: 'none',
              borderLeft: `2px solid ${line}`,
              padding: '0.35rem 0.85rem',
              fontWeight: 800,
              fontSize: '0.75rem',
              cursor: 'pointer',
              background: mode === 'bars' ? line : surface,
              color: mode === 'bars' ? readCssVar('--sl-ticker-fg', '#fff') : ink,
            }}
          >
            Bars
          </button>
        </div>
        <button type="button" className="sl-btn sl-btn--ghost sl-btn--sm" onClick={onPng}>
          Export PNG
        </button>
      </div>

      <div className="cost-trend-chart__canvas" role="figure" aria-label={`${subscriptionName} cost trend`}>
        <svg width="100%" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="xMidYMid meet" style={{ display: 'block' }}>
          <rect x="0" y="0" width={w} height={h} fill={surface} stroke={line} strokeWidth="2" rx="12" />
          {mode === 'line' ? (
            <>
              <path d={pathD} fill="none" stroke={line} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              <circle
                cx={lastX}
                cy={lastY}
                r="6"
                fill={priceIncreases.some((m) => m.month === points[points.length - 1]?.month) ? coral : line}
                stroke={line}
                strokeWidth="2"
              />
            </>
          ) : (
            <g>
              {points.map((pt, i) => {
                const bw = (w - pad * 2) / points.length - 4
                const x = pad + (i / Math.max(1, points.length - 1)) * (w - pad * 2) - bw / 2
                const vals = points.map((p) => p.amount)
                const min = Math.min(...vals)
                const max = Math.max(...vals)
                const span = max - min || 1
                const barH = ((pt.amount - min) / span) * (h - pad * 2)
                const y = pad + (h - pad * 2) - barH
                return (
                  <rect
                    key={pt.month}
                    x={x}
                    y={y}
                    width={Math.max(4, bw)}
                    height={barH}
                    fill={coral}
                    stroke={line}
                    strokeWidth="1.5"
                    rx="3"
                  />
                )
              })}
            </g>
          )}
        </svg>
      </div>

      {priceIncreases.length > 0 ? (
        <section style={{ marginTop: '1rem' }} aria-label="Price increase points">
          <h4 style={{ margin: '0 0 0.5rem', fontSize: '0.75rem', fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            Price increases
          </h4>
          <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
            {priceIncreases.map((m) => (
              <li
                key={`${m.month}-${m.newAmount}`}
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '0.5rem',
                  alignItems: 'center',
                  padding: '0.35rem 0',
                  borderBottom: `1px solid rgba(${borderRgb},0.12)`,
                  fontSize: '0.875rem',
                }}
              >
                <span
                  style={{
                    padding: '0.1rem 0.45rem',
                    borderRadius: 999,
                    border: `2px solid ${line}`,
                    background: summaryA,
                    fontWeight: 800,
                    fontSize: '0.7rem',
                  }}
                >
                  {m.month}
                </span>
                <span>
                  {m.oldAmount.toLocaleString(undefined, { style: 'currency', currency: 'USD' })} →{' '}
                  {m.newAmount.toLocaleString(undefined, { style: 'currency', currency: 'USD' })} (+{m.increasePct.toFixed(1)}%)
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  )
}

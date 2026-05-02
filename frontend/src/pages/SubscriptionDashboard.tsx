/**
 * Subscription dashboard — neo-brutalist reference UI.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import styled from '@emotion/styled'
import { useNavigate } from 'react-router-dom'
import { LayoutGroup, motion } from 'framer-motion'

import CostTrendChart from '@components/CostTrendChart'
import { ThemeToggle } from '@components/layout/ThemeToggle'
import { TickerBar } from '@components/layout/TickerBar'
import AlertBanner from '@components/ui/AlertBanner'
import { Card } from '@components/ui/Card'
import { CategoryPills, FilterPills, type FilterPillItem } from '@components/ui/FilterPills'
import { NeoModal } from '@components/ui/NeoModal'
import { PriorityHikeCard } from '@components/ui/PriorityHikeCard'
import { StatCard } from '@components/ui/StatCard'
import { SubscriptionCard } from '@components/ui/SubscriptionCard'
import { useCountUp } from '@/hooks/useCountUp'
import { useDashboardStore } from '@/stores/dashboardStore'
import type { PriceHikeAlert } from '@/types/alerts'
import type { MonthlyCostPoint } from '@/types/subscription'
import type { SubscriptionRow } from '@/types/subscription'
import type { DashboardPillId } from '@components/ui/theme'

const WELLNESS_PILLS: FilterPillItem[] = [
  { id: 'all', label: 'All' },
  { id: 'hikes', label: 'Hiked', dot: 'coral' },
  { id: 'unused', label: 'Unused', dot: 'yellow' },
  { id: 'active', label: 'Active', dot: 'green' },
]

function applyWellnessPill(rows: SubscriptionRow[], pill: DashboardPillId): SubscriptionRow[] {
  if (pill === 'all') {
    return rows
  }
  if (pill === 'hikes') {
    return rows.filter((r) => (r.price_hike_percent ?? 0) > 10 || r.health === 'escalating' || r.health === 'critical')
  }
  if (pill === 'unused') {
    return rows.filter((r) => r.health === 'zombie')
  }
  if (pill === 'active') {
    return rows.filter((r) => r.health === 'active')
  }
  return rows
}

function estimateOldMonthly(row: SubscriptionRow): number | null {
  if (row.price_hike_percent == null || row.price_hike_percent <= 10) {
    return null
  }
  return row.monthly_cost / (1 + row.price_hike_percent / 100)
}

function overpaidSinceHike(row: SubscriptionRow): number {
  const oldP = estimateOldMonthly(row)
  if (oldP == null) {
    return 0
  }
  return Math.max(0, (row.monthly_cost - oldP) * 6)
}

function momFootnote(subs: SubscriptionRow[], trendMap: Record<string, { points: MonthlyCostPoint[] }>): string | null {
  let start = 0
  let end = 0
  for (const s of subs) {
    const pts = trendMap[s.id]?.points
    if (!pts?.length) {
      continue
    }
    start += pts[0].amount
    end += pts[pts.length - 1].amount
  }
  if (start <= 0) {
    return null
  }
  const pct = ((end - start) / start) * 100
  if (Math.abs(pct) < 0.35) {
    return null
  }
  const arrow = pct > 0 ? '↑' : '↓'
  return `${arrow} ${Math.abs(pct).toFixed(1)}% vs window start`
}

function exportSubscriptionsCsv(rows: SubscriptionRow[]) {
  const headers = ['name', 'category', 'monthly_cost', 'health', 'last_billed', 'billing_cycle']
  const lines = [
    headers.join(','),
    ...rows.map((r) =>
      [r.name, r.category, r.monthly_cost, r.health, r.last_billed, r.billing_cycle ?? ''].map((c) => `"${String(c).replace(/"/g, '""')}"`).join(','),
    ),
  ]
  const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'subleech-subscriptions.csv'
  a.click()
  URL.revokeObjectURL(url)
}

function LogoMark() {
  return (
    <svg width="32" height="32" viewBox="0 0 36 36" aria-hidden>
      <path d="M18 2C10 2 4 9 4 17c0 8 7 14 14 17 7-3 14-9 14-17C32 9 26 2 18 2z" fill="#ff4d3d" stroke="#0a0a0a" strokeWidth="2" />
      <text x="18" y="22" textAnchor="middle" fontSize="14" fontWeight="800" fill="#fff" fontFamily="system-ui">
        S
      </text>
    </svg>
  )
}

const PageHeader = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 0.5rem;
`

const VerdictTitle = styled.h1`
  margin: 0.25rem 0 0;
  font-family: var(--sl-font-serif);
  font-size: clamp(1.75rem, 4vw, 2.5rem);
  font-weight: 800;
  line-height: 1.05;
  color: var(--sl-ink);
`

const VerdictGrad = styled.span`
  background: linear-gradient(90deg, #ff4d3d, #c92a2a);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
`

const SummaryStrip = styled.div`
  display: flex;
  align-items: center;
  gap: 0.65rem;
  padding: 0.75rem 1rem;
  border-radius: var(--sl-radius-pill);
  background: linear-gradient(90deg, var(--sl-summary-a), var(--sl-summary-b));
  border: 2px solid var(--sl-line);
  box-shadow: var(--sl-shadow-sm);
  font-size: 0.9rem;
  font-weight: 800;
  color: var(--sl-coral);
`

const Kicker = styled.p`
  margin: 0;
  font-size: 0.65rem;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--sl-muted);
`

const SectionTitle = styled.h2`
  margin: 0;
  font-family: var(--sl-font-serif);
  font-size: clamp(1.35rem, 3vw, 1.85rem);
  font-weight: 800;
  color: var(--sl-ink);
`

const ToolbarRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  justify-content: space-between;
  gap: 1rem;
`

const SearchInput = styled.input`
  width: 100%;
  max-width: 22rem;
  min-height: 46px;
  padding: 0.55rem 1rem 0.55rem 2.5rem;
  border-radius: var(--sl-radius-pill);
  border: 2px solid var(--sl-line);
  background-color: var(--sl-surface);
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='18' height='18' fill='%230a0a0a'%3E%3Cpath d='M12 11h-.79l-.28-.27A6.47 6.47 0 0013 6.5 6.5 6.5 0 106.5 13a6.47 6.47 0 004.23-1.57l.27.28v.79l5 4.99L16.99 16l-4.99-5zm-5.5 0C5.01 11 3 8.99 3 6.5S5.01 2 7.5 2 12 4.01 12 6.5 9.99 11 7.5 11z'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: 0.75rem center;
  font-size: 0.9375rem;
  font-weight: 600;
  color: var(--sl-ink);
  box-shadow: var(--sl-shadow-sm);

  &:focus {
    outline: 3px solid var(--sl-coral);
    outline-offset: 2px;
  }

  &::placeholder {
    color: var(--sl-muted);
  }
`

const ClearLink = styled.button`
  border: none;
  background: none;
  padding: 0;
  margin-top: 0.35rem;
  font-size: 0.875rem;
  font-weight: 800;
  color: var(--sl-coral);
  cursor: pointer;
  text-decoration: underline;
`

const Celebrate = styled(Card)`
  padding: 1.1rem 1.25rem;
  border-color: #16a34a;
  background: #f0fdf4;
`

const EmptyIllu = styled.div`
  max-width: 18rem;
  margin-bottom: 1rem;
  color: var(--sl-coral);
`

const FooterTag = styled.p`
  text-align: center;
  font-size: 0.7rem;
  font-weight: 800;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--sl-muted);
  margin: 2.5rem 0 0;
  padding-top: 1.5rem;
  border-top: 2px solid var(--sl-line);
`

const Stack = styled.div<{ $gap?: number }>`
  display: flex;
  flex-direction: column;
  gap: ${({ $gap = 5 }) => $gap * 0.25}rem;
`

export default function SubscriptionDashboard() {
  const navigate = useNavigate()
  const subscriptions = useDashboardStore((s) => s.subscriptions)
  const alerts = useDashboardStore((s) => s.alerts)
  const trends = useDashboardStore((s) => s.trends)
  const source = useDashboardStore((s) => s.source)
  const loadDemo = useDashboardStore((s) => s.loadDemo)

  const [wellnessPill, setWellnessPill] = useState<DashboardPillId>('all')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedId, setSelectedId] = useState('')
  const [dismissedAlertIds, setDismissedAlertIds] = useState(() => new Set<string>())
  const [skeleton, setSkeleton] = useState(true)
  const announceRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const t = window.setTimeout(() => setSkeleton(false), 480)
    return () => window.clearTimeout(t)
  }, [])

  const categories = useMemo(() => {
    const u = new Set(subscriptions.map((s) => s.category))
    return ['all', ...Array.from(u).sort()]
  }, [subscriptions])

  const categoryPillItems = useMemo(
    () => categories.map((c) => ({ id: c, text: c === 'all' ? 'All categories' : c })),
    [categories],
  )

  const wellnessFiltered = useMemo(() => applyWellnessPill(subscriptions, wellnessPill), [subscriptions, wellnessPill])

  const categoryFiltered = useMemo(() => {
    if (categoryFilter === 'all') {
      return wellnessFiltered
    }
    return wellnessFiltered.filter((s) => s.category === categoryFilter)
  }, [wellnessFiltered, categoryFilter])

  const filteredSubscriptions = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) {
      return categoryFiltered
    }
    return categoryFiltered.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.category.toLowerCase().includes(q) ||
        s.health.toLowerCase().includes(q) ||
        s.last_billed.toLowerCase().includes(q) ||
        s.monthly_cost.toFixed(2).includes(q),
    )
  }, [categoryFiltered, searchQuery])

  const priorityRows = useMemo(
    () =>
      filteredSubscriptions.filter((s) => (s.price_hike_percent ?? 0) > 10 || s.health === 'escalating' || s.health === 'critical'),
    [filteredSubscriptions],
  )

  const priorityIds = useMemo(() => new Set(priorityRows.map((r) => r.id)), [priorityRows])

  const gridRows = useMemo(
    () => filteredSubscriptions.filter((s) => !priorityIds.has(s.id)),
    [filteredSubscriptions, priorityIds],
  )

  const summary = useMemo(() => {
    const totalMonthly = filteredSubscriptions.reduce((acc, s) => acc + s.monthly_cost, 0)
    const zombieOrCritical = filteredSubscriptions.filter((s) => s.health === 'zombie' || s.health === 'critical')
    const potentialMonthly = zombieOrCritical.reduce((acc, s) => acc + s.monthly_cost, 0)
    const activeCount = filteredSubscriptions.filter((s) => s.health === 'active').length
    return {
      totalMonthly,
      annualSavings: potentialMonthly * 12,
      activeCount,
      totalTracked: subscriptions.length,
    }
  }, [filteredSubscriptions, subscriptions.length])

  const activeDisplay = useCountUp(summary.activeCount, 720)
  const moneyDisplay = useCountUp(summary.totalMonthly, 880)
  const savingsDisplay = useCountUp(summary.annualSavings, 1040)

  const rowModelById = useMemo(
    () => Object.fromEntries(filteredSubscriptions.map((s) => [s.id, s])) as Record<string, SubscriptionRow>,
    [filteredSubscriptions],
  )

  const selectedTrend = trends[selectedId] ?? { points: [], hikes: [] }
  const selectedSub = selectedId ? rowModelById[selectedId] : undefined

  const mom = useMemo(() => momFootnote(filteredSubscriptions, trends), [filteredSubscriptions, trends])

  const savingsMultiplier =
    summary.totalMonthly > 0 && summary.annualSavings > 0
      ? `That's ${(summary.annualSavings / summary.totalMonthly).toFixed(1)}× your monthly spend!`
      : null

  const hikeAlertCount = useMemo(
    () => filteredSubscriptions.filter((s) => (s.price_hike_percent ?? 0) > 10).length,
    [filteredSubscriptions],
  )

  const tickerSegments = useMemo(() => {
    const parts = [
      `${savingsDisplay.toLocaleString(undefined, { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })} recoverable`,
      "We're on your side",
      `Scanned ${subscriptions.length} charges`,
      hikeAlertCount > 0 ? `${hikeAlertCount} silent hikes caught` : 'No silent hikes in view',
    ]
    return parts
  }, [savingsDisplay, subscriptions.length, hikeAlertCount])

  const announce = useCallback((msg: string) => {
    const el = announceRef.current
    if (el) {
      el.textContent = msg
    }
  }, [])

  const handleGenerateFromAlert = useCallback(
    (alert: PriceHikeAlert) => {
      const match = subscriptions.find((s) => s.name === alert.subscriptionName)
      if (match) {
        navigate(`/ai-editor/${encodeURIComponent(match.id)}?intent=cancel`)
      }
    },
    [navigate, subscriptions],
  )

  const handleTakeAction = useCallback(
    (alert: PriceHikeAlert) => {
      const match = subscriptions.find((s) => s.name === alert.subscriptionName)
      if (match) {
        navigate(`/ai-editor/${encodeURIComponent(match.id)}?intent=negotiate`)
      }
    },
    [navigate, subscriptions],
  )

  const dismissAlert = useCallback((id: string) => {
    setDismissedAlertIds((prev) => new Set(prev).add(id))
  }, [])

  const filtersActive = wellnessPill !== 'all' || categoryFilter !== 'all' || searchQuery.trim().length > 0

  const clearFilters = useCallback(() => {
    setWellnessPill('all')
    setCategoryFilter('all')
    setSearchQuery('')
  }, [])

  const showHikeCelebration = alerts.length === 0

  const shareReport = useCallback(async () => {
    const text = `SubLeech — ${filteredSubscriptions.length} subscriptions · ${summary.totalMonthly.toLocaleString(undefined, { style: 'currency', currency: 'USD' })} / mo`
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({ title: 'SubLeech report', text })
      } catch {
        /* dismissed */
      }
    } else {
      await navigator.clipboard.writeText(text)
    }
  }, [filteredSubscriptions.length, summary.totalMonthly])

  if (subscriptions.length === 0) {
    return (
      <div className="sl-dashboard">
        <TickerBar />
        <div ref={announceRef} className="sl-sr-only" role="status" aria-live="polite" aria-atomic="true" />
        <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '0.75rem' }}>
          <ThemeToggle />
        </div>
        <Stack $gap={6} style={{ paddingTop: '0.5rem', maxWidth: 520 }}>
          <EmptyIllu aria-hidden>
            <svg viewBox="0 0 120 100" width="100%" height="100">
              <rect x="10" y="20" width="100" height="60" rx="8" fill="currentColor" opacity="0.15" />
              <path d="M30 45h60M30 58h40" stroke="currentColor" strokeWidth="4" strokeLinecap="round" opacity="0.4" />
              <circle cx="85" cy="38" r="12" fill="currentColor" opacity="0.3" />
            </svg>
          </EmptyIllu>
          <VerdictTitle>No subscription data yet</VerdictTitle>
          <p style={{ margin: 0, color: 'var(--sl-muted)' }}>
            Upload a bank CSV from the home page, or load demo data to explore the dashboard.
          </p>
          <div className="sl-btn-row">
            <button type="button" className="sl-btn sl-btn--black" onClick={() => navigate('/')}>
              Go to upload
            </button>
            <button type="button" className="sl-btn sl-btn--ghost" onClick={() => loadDemo()}>
              Load demo data
            </button>
          </div>
        </Stack>
      </div>
    )
  }

  return (
    <>
      <div ref={announceRef} className="sl-sr-only" role="status" aria-live="polite" aria-atomic="true" />
      <TickerBar segments={tickerSegments} />
      <div className="sl-dashboard">
        <Stack $gap={6}>
          <PageHeader>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                <LogoMark />
                <span style={{ fontWeight: 800, fontSize: '0.8rem', letterSpacing: '0.08em' }}>SUBLEECH</span>
              </div>
              <VerdictTitle>
                The <VerdictGrad>verdict.</VerdictGrad>
              </VerdictTitle>
              <p style={{ margin: '0.35rem 0 0', fontSize: '0.95rem', fontWeight: 600, color: 'var(--sl-muted)' }}>
                Here&apos;s what&apos;s been quietly nibbling on your account.
              </p>
              <p style={{ margin: '0.25rem 0 0', fontSize: '0.75rem', color: 'var(--sl-muted)' }}>
                {source === 'demo' ? 'Demo data loaded.' : 'From your last upload.'}
              </p>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center' }}>
              <ThemeToggle />
              <button type="button" className="sl-btn sl-btn--ghost sl-btn--sm" onClick={() => exportSubscriptionsCsv(filteredSubscriptions)}>
                📤 Export
              </button>
              <button type="button" className="sl-btn sl-btn--ghost sl-btn--sm" onClick={() => void shareReport()}>
                🔗 Share
              </button>
            </div>
          </PageHeader>

          {skeleton ? (
            <div className="sl-stat-carousel" aria-busy="true" aria-label="Loading summary">
              <div className="sl-skeleton" style={{ height: 120, borderRadius: 18, border: '2px solid var(--sl-line)' }} />
              <div className="sl-skeleton" style={{ height: 120, borderRadius: 18, border: '2px solid var(--sl-line)' }} />
              <div className="sl-skeleton" style={{ height: 120, borderRadius: 18, border: '2px solid var(--sl-line)' }} />
            </div>
          ) : (
            <div className="sl-stat-carousel">
              <StatCard
                label="Outflow"
                value={moneyDisplay.toLocaleString(undefined, {
                  style: 'currency',
                  currency: 'USD',
                  maximumFractionDigits: 0,
                })}
                variant="purple"
                appearance="soft"
                icon="💸"
                subLabel="per month"
                footnote={mom}
                ariaLabel="Total monthly subscription spend"
              />
              <StatCard
                label="Inventory"
                value={String(Math.round(activeDisplay))}
                variant="teal"
                appearance="soft"
                icon="📦"
                subLabel="active services"
                metaLine={`${subscriptions.length} total tracked`}
                ariaLabel="Active subscription count"
              />
              <StatCard
                label="Recoverable"
                value={savingsDisplay.toLocaleString(undefined, {
                  style: 'currency',
                  currency: 'USD',
                  maximumFractionDigits: 0,
                })}
                variant="gold"
                appearance="solid"
                icon="⚡"
                subLabel="you could save / year"
                metaLine={savingsMultiplier}
                ariaLabel="Potential annual savings"
              />
            </div>
          )}

          {hikeAlertCount > 0 ? (
            <SummaryStrip role="status">
              <span aria-hidden>⚠️</span>
              Heads up — {hikeAlertCount} service{hikeAlertCount === 1 ? '' : 's'} increased prices without telling you.
            </SummaryStrip>
          ) : null}

          <AlertBanner
            alerts={alerts}
            dismissedIds={dismissedAlertIds}
            onDismiss={dismissAlert}
            onGenerateResponse={handleGenerateFromAlert}
            onTakeAction={handleTakeAction}
          />

          {showHikeCelebration ? (
            <Celebrate variant="default">
              <p style={{ margin: 0, fontSize: '1rem', fontWeight: 800 }}>No backend alerts — you&apos;re in the clear! 🎉</p>
              <p style={{ margin: '0.45rem 0 0', fontSize: '0.875rem', color: 'var(--sl-muted)' }}>
                We still flag silent hikes in your statement below.
              </p>
            </Celebrate>
          ) : null}

          {priorityRows.length > 0 ? (
            <Stack $gap={3}>
              {priorityRows.map((row, i) => {
                const oldP = estimateOldMonthly(row) ?? row.monthly_cost * 0.9
                return (
                  <PriorityHikeCard
                    key={row.id}
                    row={row}
                    points={trends[row.id]?.points ?? []}
                    oldMonthlyEstimate={oldP}
                    overpaidEstimate={overpaidSinceHike(row)}
                    index={i}
                    onCancellationLetter={() => navigate(`/ai-editor/${encodeURIComponent(row.id)}?intent=cancel`)}
                    onNegotiate={() => navigate(`/ai-editor/${encodeURIComponent(row.id)}?intent=negotiate`)}
                  />
                )
              })}
            </Stack>
          ) : null}

          <Stack $gap={4}>
            <ToolbarRow>
              <div>
                <Kicker>The lineup</Kicker>
                <SectionTitle>Every recurring charge.</SectionTitle>
              </div>
              <SearchInput
                type="search"
                placeholder="Search the suspects…"
                aria-label="Search subscriptions"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </ToolbarRow>
            {filtersActive ? (
              <ClearLink type="button" onClick={clearFilters}>
                Clear all filters
              </ClearLink>
            ) : null}
            <FilterPills items={WELLNESS_PILLS} activeId={wellnessPill} onChange={setWellnessPill} />
            <CategoryPills
              items={categoryPillItems.map((c) => ({ id: c.id, label: c.text }))}
              activeId={categoryFilter}
              onChange={setCategoryFilter}
            />
          </Stack>

          <LayoutGroup>
            <motion.div className="sl-dash-grid" layout>
              {gridRows.map((row, index) => (
                <SubscriptionCard
                  key={row.id}
                  row={row}
                  points={trends[row.id]?.points ?? []}
                  selected={selectedId === row.id}
                  index={index}
                  onSelect={() => {
                    setSelectedId(row.id)
                    announce(`${row.name} selected`)
                  }}
                  onCancel={() => navigate(`/ai-editor/${encodeURIComponent(row.id)}?intent=cancel`)}
                  onNegotiate={() => navigate(`/ai-editor/${encodeURIComponent(row.id)}?intent=negotiate`)}
                />
              ))}
            </motion.div>
          </LayoutGroup>

          {filteredSubscriptions.length === 0 ? (
            <Card variant="default" style={{ padding: '1.25rem', textAlign: 'center' }}>
              <p style={{ margin: 0, color: 'var(--sl-muted)', fontWeight: 600 }}>No subscriptions match these filters.</p>
            </Card>
          ) : null}

          <FooterTag>🔥 SubLeech — on your side, against the leeches.</FooterTag>
        </Stack>
      </div>

      <NeoModal open={Boolean(selectedSub)} title={selectedSub?.name ?? 'Subscription'} onClose={() => setSelectedId('')}>
        {selectedSub ? (
          <Stack $gap={5}>
            <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: 600, color: 'var(--sl-muted)' }}>
              {selectedSub.category} · Last billed {selectedSub.last_billed}
            </p>
            <CostTrendChart
              subscriptionName={selectedSub.name}
              points={selectedTrend.points}
              priceIncreases={selectedTrend.hikes}
            />
            <div className="sl-btn-row">
              <button
                type="button"
                className="sl-btn sl-btn--coral"
                onClick={() => navigate(`/ai-editor/${encodeURIComponent(selectedSub.id)}?intent=cancel`)}
              >
                Cancellation letter
              </button>
              <button
                type="button"
                className="sl-btn sl-btn--black"
                onClick={() => navigate(`/ai-editor/${encodeURIComponent(selectedSub.id)}?intent=negotiate`)}
              >
                Negotiate
              </button>
            </div>
          </Stack>
        ) : null}
      </NeoModal>
    </>
  )
}

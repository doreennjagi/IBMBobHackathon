/**
 * SubscriptionDashboard
 *
 * Primary operator view: subscription table, wellness badges, summary KPIs,
 * search/filter, and quick actions to launch cancellation / negotiation flows.
 * Data is mocked here; swap the source for React Query + REST when the API is wired.
 */

import { useCallback, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Button,
  ButtonSet,
  Content,
  DataTable,
  Dropdown,
  Grid,
  Column,
  Layer,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableHeader,
  TableRow,
  TableToolbar,
  TableToolbarContent,
  TableToolbarSearch,
  Tag,
  Tile,
} from '@carbon/react'
import AlertBanner from '@components/AlertBanner'
import CostTrendChart from '@components/CostTrendChart'
import type { PriceHikeAlert } from '@/types/alerts'
import type { MonthlyCostPoint, PriceIncreaseMarker, SubscriptionHealth, SubscriptionRow } from '@/types/subscription'

const MOCK_SUBSCRIPTIONS: SubscriptionRow[] = [
  {
    id: 'sub-1',
    name: 'StreamVault Plus',
    category: 'Streaming',
    monthly_cost: 16.99,
    health: 'escalating',
    last_billed: '2025-04-12',
  },
  {
    id: 'sub-2',
    name: 'CloudNote Pro',
    category: 'Productivity',
    monthly_cost: 11.49,
    health: 'active',
    last_billed: '2025-04-01',
  },
  {
    id: 'sub-3',
    name: 'FitPulse',
    category: 'Health',
    monthly_cost: 9.99,
    health: 'zombie',
    last_billed: '2024-11-03',
  },
  {
    id: 'sub-4',
    name: 'MegaMobile',
    category: 'Telecom',
    monthly_cost: 89.0,
    health: 'critical',
    last_billed: '2025-04-15',
  },
]

const MOCK_ALERTS: PriceHikeAlert[] = [
  {
    id: 'alert-1',
    subscriptionName: 'StreamVault Plus',
    oldPrice: 14.99,
    newPrice: 16.99,
    increasePercentage: 13.3,
  },
]

const TREND_BY_ID: Record<
  string,
  { points: MonthlyCostPoint[]; hikes: PriceIncreaseMarker[] }
> = {
  'sub-1': {
    points: [
      { month: 'May', amount: 12.99 },
      { month: 'Jun', amount: 12.99 },
      { month: 'Jul', amount: 12.99 },
      { month: 'Aug', amount: 12.99 },
      { month: 'Sep', amount: 12.99 },
      { month: 'Oct', amount: 12.99 },
      { month: 'Nov', amount: 12.99 },
      { month: 'Dec', amount: 12.99 },
      { month: 'Jan', amount: 12.99 },
      { month: 'Feb', amount: 12.99 },
      { month: 'Mar', amount: 14.99 },
      { month: 'Apr', amount: 16.99 },
    ],
    hikes: [{ month: 'Mar', oldAmount: 12.99, newAmount: 14.99, increasePct: 15.4 }],
  },
  'sub-2': {
    points: Array.from({ length: 12 }, (_, i) => ({
      month: ['May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr'][i] ?? 'May',
      amount: 11.49,
    })),
    hikes: [],
  },
  'sub-3': {
    points: Array.from({ length: 12 }, (_, i) => ({
      month: ['May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr'][i] ?? 'May',
      amount: 9.99,
    })),
    hikes: [],
  },
  'sub-4': {
    points: [
      { month: 'May', amount: 65 },
      { month: 'Jun', amount: 65 },
      { month: 'Jul', amount: 72 },
      { month: 'Aug', amount: 72 },
      { month: 'Sep', amount: 78 },
      { month: 'Oct', amount: 78 },
      { month: 'Nov', amount: 82 },
      { month: 'Dec', amount: 82 },
      { month: 'Jan', amount: 85 },
      { month: 'Feb', amount: 85 },
      { month: 'Mar', amount: 87 },
      { month: 'Apr', amount: 89 },
    ],
    hikes: [
      { month: 'Jul', oldAmount: 65, newAmount: 72, increasePct: 10.8 },
      { month: 'Nov', oldAmount: 78, newAmount: 82, increasePct: 5.1 },
    ],
  },
}

const HEALTH_ITEMS: { id: SubscriptionHealth | 'all'; text: string }[] = [
  { id: 'all', text: 'All statuses' },
  { id: 'active', text: 'Active' },
  { id: 'zombie', text: 'Zombie' },
  { id: 'escalating', text: 'Escalating' },
  { id: 'critical', text: 'Critical' },
]

function healthTagType(health: SubscriptionHealth): 'green' | 'gray' | 'purple' | 'red' {
  switch (health) {
    case 'active':
      return 'green'
    case 'zombie':
      return 'gray'
    case 'escalating':
      return 'purple'
    case 'critical':
      return 'red'
  }
}

function formatHealthLabel(health: SubscriptionHealth): string {
  return health.charAt(0).toUpperCase() + health.slice(1)
}

export default function SubscriptionDashboard() {
  const navigate = useNavigate()
  const [healthFilter, setHealthFilter] = useState<SubscriptionHealth | 'all'>('all')
  const [selectedId, setSelectedId] = useState<string>(MOCK_SUBSCRIPTIONS[0]?.id ?? '')

  const filteredSubscriptions = useMemo(() => {
    if (healthFilter === 'all') {
      return MOCK_SUBSCRIPTIONS
    }
    return MOCK_SUBSCRIPTIONS.filter((s) => s.health === healthFilter)
  }, [healthFilter])

  const summary = useMemo(() => {
    const totalMonthly = filteredSubscriptions.reduce((acc, s) => acc + s.monthly_cost, 0)
    const zombieOrCritical = filteredSubscriptions.filter((s) => s.health === 'zombie' || s.health === 'critical')
    const potentialMonthlySavings = zombieOrCritical.reduce((acc, s) => acc + s.monthly_cost, 0)
    return {
      totalMonthly,
      count: filteredSubscriptions.length,
      potentialMonthlySavings,
    }
  }, [filteredSubscriptions])

  const headers = useMemo(
    () => [
      { key: 'name', header: 'Name' },
      { key: 'category', header: 'Category' },
      { key: 'monthly_cost', header: 'Monthly cost' },
      { key: 'health', header: 'Status' },
      { key: 'last_billed', header: 'Last billed' },
      { key: 'actions', header: 'Actions' },
    ],
    [],
  )

  const rows = useMemo(
    () =>
      filteredSubscriptions.map((s) => ({
        id: s.id,
        name: s.name,
        category: s.category,
        monthly_cost: s.monthly_cost,
        health: s.health,
        last_billed: s.last_billed,
        actions: '',
      })),
    [filteredSubscriptions],
  )

  const rowModelById = useMemo(
    () => Object.fromEntries(filteredSubscriptions.map((s) => [s.id, s])) as Record<string, SubscriptionRow>,
    [filteredSubscriptions],
  )

  const selectedTrend = TREND_BY_ID[selectedId] ?? { points: [], hikes: [] }
  const selectedSub = rowModelById[selectedId]

  const onHealthDropdownChange = useCallback(
    (data: { selectedItem?: { id: string; text: string } | null }) => {
      const id = data.selectedItem?.id
      if (id === 'active' || id === 'zombie' || id === 'escalating' || id === 'critical' || id === 'all') {
        setHealthFilter(id)
      }
    },
    [],
  )

  const handleTakeAction = useCallback(
    (alert: PriceHikeAlert) => {
      const match = MOCK_SUBSCRIPTIONS.find((s) => s.name === alert.subscriptionName)
      if (match) {
        navigate(`/ai-editor/${encodeURIComponent(match.id)}?intent=negotiate`)
      }
    },
    [navigate],
  )

  return (
    <Content>
      <Grid fullWidth narrow className="subscription-dashboard">
        <Column lg={16} md={8} sm={4}>
          <Stack gap={7}>
            <header>
              <h1 className="cds--type-productive-heading-05">Subscription intelligence</h1>
              <p className="cds--type-body-01">
                Review recurring charges, spot unhealthy billing patterns, and launch AI-assisted actions.
              </p>
            </header>

            <AlertBanner alerts={MOCK_ALERTS} onTakeAction={handleTakeAction} />

            <Layer level={1}>
              <Grid fullWidth>
                <Column sm={4} md={4} lg={5}>
                  <Tile role="region" aria-label="Total monthly subscription spend">
                    <Stack gap={3}>
                      <p className="cds--label-01">Total monthly spend</p>
                      <p className="cds--type-productive-heading-04">
                        {summary.totalMonthly.toLocaleString(undefined, { style: 'currency', currency: 'USD' })}
                      </p>
                    </Stack>
                  </Tile>
                </Column>
                <Column sm={4} md={4} lg={5}>
                  <Tile role="region" aria-label="Number of tracked subscriptions">
                    <Stack gap={3}>
                      <p className="cds--label-01">Subscriptions</p>
                      <p className="cds--type-productive-heading-04">{summary.count}</p>
                    </Stack>
                  </Tile>
                </Column>
                <Column sm={4} md={8} lg={6}>
                  <Tile role="region" aria-label="Potential monthly savings from zombie or critical subscriptions">
                    <Stack gap={3}>
                      <p className="cds--label-01">Potential savings (zombie / critical)</p>
                      <p className="cds--type-productive-heading-04">
                        {summary.potentialMonthlySavings.toLocaleString(undefined, {
                          style: 'currency',
                          currency: 'USD',
                        })}
                        <span className="cds--type-caption-01"> / month</span>
                      </p>
                    </Stack>
                  </Tile>
                </Column>
              </Grid>
            </Layer>

            <Stack gap={5}>
              <Dropdown
                id="subscription-health-filter"
                titleText="Filter by wellness status"
                label="Filter subscriptions"
                items={HEALTH_ITEMS}
                selectedItem={HEALTH_ITEMS.find((i) => i.id === healthFilter) ?? HEALTH_ITEMS[0]}
                itemToString={(item) => (item ? item.text : '')}
                onChange={onHealthDropdownChange}
              />

              <DataTable
                rows={rows}
                headers={headers}
                filterRows={({ rowIds, inputValue }) => {
                  const q = inputValue.trim().toLowerCase()
                  if (!q) {
                    return rowIds
                  }
                  return rowIds.filter((id) => {
                    const m = rowModelById[id]
                    if (!m) {
                      return false
                    }
                    return (
                      m.name.toLowerCase().includes(q) ||
                      m.category.toLowerCase().includes(q) ||
                      m.health.toLowerCase().includes(q) ||
                      m.last_billed.toLowerCase().includes(q) ||
                      m.monthly_cost.toFixed(2).includes(q)
                    )
                  })
                }}
                render={({ rows: tableRows, headers: hdrs, getHeaderProps, getRowProps, getTableProps, onInputChange }) => (
                  <TableContainer title="Subscriptions">
                    <TableToolbar aria-label="Subscription table toolbar">
                      <TableToolbarContent>
                        <TableToolbarSearch
                          persistent
                          placeholder="Search name, category, status, or amount"
                          labelText="Search subscriptions"
                          id="subscription-table-search"
                          onChange={(e, value) => onInputChange(e, value ?? '')}
                        />
                      </TableToolbarContent>
                    </TableToolbar>
                    <Table {...getTableProps()} aria-label="Subscription list">
                      <TableHead>
                        <TableRow>
                          {hdrs.map((header) => (
                            <TableHeader {...getHeaderProps({ header })}>{header.header}</TableHeader>
                          ))}
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {tableRows.map((row) => (
                          <TableRow
                            {...getRowProps({
                              row,
                              onClick: () => setSelectedId(row.id),
                            })}
                            aria-selected={selectedId === row.id}
                          >
                            {row.cells.map((cell) => {
                              const headerKey = cell.info.header
                              if (headerKey === 'health') {
                                const model = rowModelById[row.id]
                                const h = (model?.health ?? 'active') as SubscriptionHealth
                                return (
                                  <TableCell key={cell.id}>
                                    <Tag type={healthTagType(h)} size="md" aria-label={`Wellness status ${formatHealthLabel(h)}`}>
                                      {formatHealthLabel(h)}
                                    </Tag>
                                  </TableCell>
                                )
                              }
                              if (headerKey === 'monthly_cost') {
                                const model = rowModelById[row.id]
                                const amt = model?.monthly_cost ?? Number(cell.value)
                                return (
                                  <TableCell key={cell.id}>
                                    {amt.toLocaleString(undefined, { style: 'currency', currency: 'USD' })}
                                  </TableCell>
                                )
                              }
                              if (headerKey === 'actions') {
                                return (
                                  <TableCell key={cell.id}>
                                    <ButtonSet stacked>
                                      <Button
                                        kind="secondary"
                                        size="sm"
                                        aria-label={`Cancel ${rowModelById[row.id]?.name ?? 'subscription'}`}
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          navigate(`/ai-editor/${encodeURIComponent(row.id)}?intent=cancel`)
                                        }}
                                      >
                                        Cancel
                                      </Button>
                                      <Button
                                        kind="tertiary"
                                        size="sm"
                                        aria-label={`Negotiate ${rowModelById[row.id]?.name ?? 'subscription'}`}
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          navigate(`/ai-editor/${encodeURIComponent(row.id)}?intent=negotiate`)
                                        }}
                                      >
                                        Negotiate
                                      </Button>
                                    </ButtonSet>
                                  </TableCell>
                                )
                              }
                              return <TableCell key={cell.id}>{String(cell.value ?? '')}</TableCell>
                            })}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              />
            </Stack>

            {selectedSub ? (
              <section aria-label="Twelve month cost trend for selected subscription">
                <h2 className="cds--type-productive-heading-04">Cost trend — {selectedSub.name}</h2>
                <p className="cds--type-helper-text-01">Select a row in the table above to change the chart.</p>
                <CostTrendChart
                  subscriptionName={selectedSub.name}
                  points={selectedTrend.points}
                  priceIncreases={selectedTrend.hikes}
                />
              </section>
            ) : null}
          </Stack>
        </Column>
      </Grid>
    </Content>
  )
}

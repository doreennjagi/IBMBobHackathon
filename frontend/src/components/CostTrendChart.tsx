/**
 * CostTrendChart
 *
 * Renders a 12-month IBM Carbon LineChart for one subscription and surfaces
 * price-increase context as an accessible annotation list (Carbon Charts does
 * not expose per-point markup hooks, so hikes are called out in text/tags).
 */

import { useMemo } from 'react'
import { LineChart } from '@carbon/charts-react'
import type { ChartTabularData, LineChartOptions } from '@carbon/charts'
import { ScaleTypes } from '@carbon/charts'
import { Column, Grid, Stack, Tag } from '@carbon/react'

import type { MonthlyCostPoint, PriceIncreaseMarker } from '@/types/subscription'

export interface CostTrendChartProps {
  /** Shown in chart title and screen reader labels. */
  subscriptionName: string
  /** Twelve (or fewer) months of billed amounts. */
  points: MonthlyCostPoint[]
  /** Months where the amount jumped; drives annotation list. */
  priceIncreases: PriceIncreaseMarker[]
}

/**
 * Builds tabular chart rows: one ``group`` per subscription so the legend stays minimal.
 */
function toChartData(name: string, points: MonthlyCostPoint[]): ChartTabularData {
  return points.map((p) => ({
    group: name,
    key: p.month,
    value: p.amount,
  }))
}

export default function CostTrendChart({
  subscriptionName,
  points,
  priceIncreases,
}: CostTrendChartProps) {
  const data = useMemo(() => toChartData(subscriptionName, points), [subscriptionName, points])

  const options: LineChartOptions = useMemo(
    () => ({
      title: `${subscriptionName} — 12-month cost`,
      axes: {
        bottom: {
          title: 'Billing month',
          mapsTo: 'key',
          scaleType: ScaleTypes.LABELS,
        },
        left: {
          title: 'Charge (USD)',
          mapsTo: 'value',
          scaleType: ScaleTypes.LINEAR,
          includeZero: false,
        },
      },
      curve: 'curveMonotoneX',
      height: '280px',
      resizable: true,
      legend: { enabled: false },
      tooltip: {
        showTotal: false,
        valueFormatter: (value) =>
          typeof value === 'number'
            ? value.toLocaleString(undefined, { style: 'currency', currency: 'USD' })
            : String(value),
      },
      accessibility: {
        svgAriaLabel: `Line chart of monthly charges for ${subscriptionName}`,
      },
    }),
    [subscriptionName],
  )

  return (
    <Grid fullWidth narrow className="cost-trend-chart">
      <Column lg={16} md={8} sm={4}>
        <div className="cost-trend-chart__canvas" role="figure" aria-labelledby="cost-trend-chart-title">
          <p id="cost-trend-chart-title" className="cds--assistive-text">
            {subscriptionName} monthly cost trend
          </p>
          <LineChart data={data} options={options} />
        </div>
      </Column>
      {priceIncreases.length > 0 ? (
        <Column lg={16} md={8} sm={4}>
          <section aria-label="Price increase annotations">
            <Stack gap={5}>
              <h4 className="cds--type-productive-heading-01">Price increase points</h4>
              <ul className="cost-trend-chart__annotations" role="list">
                {priceIncreases.map((m) => (
                  <li key={`${m.month}-${m.newAmount}`} role="listitem">
                    <Stack orientation="horizontal" gap={3}>
                      <Tag type="red">{m.month}</Tag>
                      <span className="cds--type-body-01">
                        {m.oldAmount.toLocaleString(undefined, { style: 'currency', currency: 'USD' })} →{' '}
                        {m.newAmount.toLocaleString(undefined, { style: 'currency', currency: 'USD' })} (
                        +{m.increasePct.toFixed(1)}%)
                      </span>
                    </Stack>
                  </li>
                ))}
              </ul>
            </Stack>
          </section>
        </Column>
      ) : null}
    </Grid>
  )
}

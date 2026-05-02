const DEFAULT_SEGMENTS = [
  '$200–600/yr is hiding right now',
  "We're on your side",
  'Netflix +$3/mo',
  'Adobe +18% this year',
  'Silent hikes hurt',
  'Receipts — not vibes',
]

export interface TickerBarProps {
  /** Short uppercase snippets; duplicated internally for seamless scroll. */
  segments?: string[]
}

function TickerContent({ parts }: { parts: string[] }) {
  return (
    <>
      {parts.map((t, i) => (
        <span key={`${t}-${i}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.65rem' }}>
          {i > 0 ? <span className="sl-ticker__sep">●</span> : null}
          <span>{t}</span>
        </span>
      ))}
    </>
  )
}

export function TickerBar({ segments }: TickerBarProps) {
  const parts = segments?.length ? segments : DEFAULT_SEGMENTS
  return (
    <div className="sl-ticker" role="presentation">
      <div className="sl-ticker__track">
        <TickerContent parts={parts} />
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.65rem' }}>
          <span className="sl-ticker__sep">●</span>
        </span>
        <TickerContent parts={parts} />
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.65rem' }}>
          <span className="sl-ticker__sep">●</span>
        </span>
        <TickerContent parts={parts} />
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.65rem' }}>
          <span className="sl-ticker__sep">●</span>
        </span>
        <TickerContent parts={parts} />
      </div>
    </div>
  )
}

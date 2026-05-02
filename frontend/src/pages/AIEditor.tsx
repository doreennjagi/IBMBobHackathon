/**
 * AI editor route — neo layout, local generation stub.
 */

import { useCallback, useEffect, useMemo, useState, type CSSProperties } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'

import AIResponseEditor from '@components/AIResponseEditor'
import { ThemeToggle } from '@components/layout/ThemeToggle'
import { useDashboardStore } from '@/stores/dashboardStore'

const GEN_MESSAGES = [
  'Analyzing your subscription billing history…',
  'Drafting your letter…',
  'Adding consumer-friendly language…',
  'Finalizing your response…',
]

function billingPlaceholderEmail(serviceName: string): string {
  const slug = serviceName.toLowerCase().replace(/[^a-z0-9]+/g, '').slice(0, 40) || 'provider'
  return `support@${slug}.example`
}

function buildCancelLetter(serviceName: string): string {
  const today = new Date().toISOString().slice(0, 10)
  return `${today}

${serviceName} Customer Care
PO Box 1000
United States

Dear ${serviceName} Customer Care,

Re: Request to cancel recurring subscription

Please cancel my recurring subscription associated with this account effective immediately. I request written confirmation that no further charges will be processed and that any prepaid balance will be refunded per your policy.

If you require additional verification, please reply to this message with the steps needed.

Sincerely,
Account holder`
}

function buildNegotiateLetter(serviceName: string): string {
  const today = new Date().toISOString().slice(0, 10)
  return `${today}

${serviceName} Customer Care
PO Box 1000
United States

Dear ${serviceName} Customer Care,

Re: Loyalty pricing review

I am writing regarding my recurring charges, which have increased recently. Given my continued use of your service, I would appreciate a review for a promotional rate, loyalty credit, or plan adjustment that better reflects current offers.

I value the service and hope we can reach a mutually agreeable arrangement.

Respectfully,
Account holder`
}

export default function AIEditor() {
  const { subscriptionId } = useParams<{ subscriptionId: string }>()
  const [searchParams] = useSearchParams()
  const intent = searchParams.get('intent') ?? 'cancel'
  const failOnce = searchParams.get('fail') === '1'

  const rawId = subscriptionId ? decodeURIComponent(subscriptionId) : ''
  const match = useDashboardStore((s) => s.subscriptions.find((x) => x.id === rawId))
  const label = match?.name ?? (rawId || 'subscription')

  const [phase, setPhase] = useState<'generating' | 'ready' | 'error'>('generating')
  const [letter, setLetter] = useState('')
  const [msgIdx, setMsgIdx] = useState(0)
  const [attempt, setAttempt] = useState(0)

  const defaultRecipient = useMemo(() => billingPlaceholderEmail(label), [label])

  useEffect(() => {
    setPhase('generating')
    setLetter('')
    setMsgIdx(0)
    const rotate = window.setInterval(() => {
      setMsgIdx((i) => (i + 1) % GEN_MESSAGES.length)
    }, 900)
    const done = window.setTimeout(() => {
      window.clearInterval(rotate)
      if (failOnce && attempt === 0) {
        setPhase('error')
        return
      }
      setLetter(intent === 'negotiate' ? buildNegotiateLetter(label) : buildCancelLetter(label))
      setPhase('ready')
    }, 2800)
    return () => {
      window.clearInterval(rotate)
      window.clearTimeout(done)
    }
  }, [attempt, failOnce, intent, label])

  const applyTemplate = useCallback(() => {
    setLetter(intent === 'negotiate' ? buildNegotiateLetter(label) : buildCancelLetter(label))
    setPhase('ready')
  }, [intent, label])

  const retry = useCallback(() => {
    setAttempt((a) => a + 1)
  }, [])

  const statusText = GEN_MESSAGES[msgIdx] ?? GEN_MESSAGES[0]
  const sentCta = intent === 'negotiate' ? 'I sent the message ✓' : 'Mark as sent ✓'

  const noticeStyle: CSSProperties = {
    padding: '1rem',
    border: '2px solid var(--sl-line)',
    borderRadius: 14,
    background: phase === 'error' ? 'var(--sl-danger-bg)' : 'var(--sl-info-bg)',
    boxShadow: 'var(--sl-shadow-sm)',
  }

  return (
    <div className="sl-dashboard" style={{ paddingTop: '1.5rem' }}>
      <div style={{ maxWidth: 960, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '0.5rem' }}>
          <ThemeToggle />
        </div>
        <header style={{ marginBottom: '1.5rem' }}>
          <Link to="/dashboard" className="sl-link" style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--sl-muted)' }}>
            ← Back to dashboard
          </Link>
          <p style={{ margin: '0.5rem 0 0', fontSize: '0.875rem', fontWeight: 600, color: 'var(--sl-muted)' }}>
            {intent === 'negotiate' ? 'Negotiation script for' : 'Cancellation letter for'}
          </p>
          <h1
            style={{
              margin: '0.15rem 0 0',
              fontFamily: 'var(--sl-font-serif)',
              fontSize: 'clamp(1.65rem, 4vw, 2.25rem)',
              fontWeight: 800,
              color: 'var(--sl-ink)',
            }}
          >
            {label}
          </h1>
        </header>

        {phase === 'error' ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.25rem' }}>
            <div style={noticeStyle}>
              <p style={{ margin: 0, fontWeight: 800 }}>Generation failed</p>
              <p style={{ margin: '0.35rem 0 0', color: 'var(--sl-muted)' }}>
                The AI service is unavailable in this demo. Use the template below or retry.
              </p>
            </div>
            <div className="sl-btn-row">
              <button type="button" className="sl-btn sl-btn--black" onClick={retry}>
                Retry generation
              </button>
              <button type="button" className="sl-btn sl-btn--ghost" onClick={applyTemplate}>
                Use template instead
              </button>
            </div>
          </div>
        ) : (
          <div style={{ ...noticeStyle, marginBottom: '1.25rem' }}>
            <p style={{ margin: 0, fontWeight: 800 }}>Demo generation</p>
            <p style={{ margin: '0.35rem 0 0', color: 'var(--sl-muted)' }}>
              Text is produced locally to simulate watsonx / agents. Wire onSendEmail for real delivery.
            </p>
          </div>
        )}

        {phase !== 'error' ? (
          <AIResponseEditor
            subscriptionLabel={label}
            originalAiText={letter}
            isGenerating={phase === 'generating'}
            generationStatusText={statusText}
            enableTypewriter
            defaultRecipientEmail={defaultRecipient}
            sentCtaLabel={sentCta}
            onSendEmail={async ({ to, subject, body }) => {
              console.info('[email stub]', { to, subject, bodyLength: body.length })
            }}
          />
        ) : null}

        {phase === 'ready' ? (
          <button type="button" className="sl-btn sl-btn--ghost sl-btn--sm" style={{ marginTop: '1rem' }} onClick={() => setAttempt((a) => a + 1)}>
            Regenerate
          </button>
        ) : null}
      </div>
    </div>
  )
}

/**
 * AIResponseEditor — side-by-side AI vs user letter, versions, email stub (no Carbon).
 */

import { useCallback, useEffect, useMemo, useState, type CSSProperties } from 'react'
import toast from 'react-hot-toast'
import { jsPDF } from 'jspdf'

import { NeoModal } from '@components/ui/NeoModal'

export interface AIResponseEditorProps {
  subscriptionLabel: string
  originalAiText: string
  isGenerating?: boolean
  generationStatusText?: string
  enableTypewriter?: boolean
  defaultRecipientEmail?: string
  onSendEmail?: (payload: { to: string; subject: string; body: string }) => Promise<void> | void
  /** Primary footer CTA label (cancellation vs negotiation copy). */
  sentCtaLabel?: string
}

export interface TextVersion {
  id: string
  label: string
  text: string
  savedAt: string
  source: 'ai' | 'user'
}

function estimateSyllables(word: string): number {
  const w = word.toLowerCase().replace(/[^a-z]/g, '')
  if (w.length <= 3) {
    return 1
  }
  const groups = w.match(/[aeiouy]+/g)
  const count = groups ? groups.length : 1
  return Math.max(1, count)
}

function computeReadabilityScore(text: string): number {
  const clean = text.trim()
  if (!clean) {
    return 0
  }
  const words = clean.split(/\s+/).filter(Boolean)
  const sentences = clean.split(/[.!?]+/).map((s) => s.trim()).filter(Boolean).length || 1
  const syllables = words.reduce((acc, w) => acc + estimateSyllables(w), 0)
  const avgWordsPerSentence = words.length / sentences
  const avgSyllablesPerWord = syllables / Math.max(1, words.length)
  const raw = 206.835 - 1.015 * avgWordsPerSentence - 84.6 * avgSyllablesPerWord
  return Math.round(Math.max(0, Math.min(100, raw)))
}

type LetterSegmentKind = 'date' | 'address' | 'salutation' | 'subject' | 'body' | 'closing' | 'signature' | 'other'

function classifyLine(line: string): LetterSegmentKind {
  const t = line.trim()
  if (/^\d{1,2}[/-]\d{1,2}[/-]\d{2,4}$/.test(t)) {
    return 'date'
  }
  if (/^(dear|to:|attention:)/i.test(t)) {
    return 'salutation'
  }
  if (/^(re:|subject:)/i.test(t)) {
    return 'subject'
  }
  if (/^(sincerely|regards|yours truly|respectfully)/i.test(t)) {
    return 'closing'
  }
  if (/^(#|suite|street|st\.|ave|road|lane|drive|blvd)/i.test(t) || /\d{3,5}\s+\w+\s+(street|st|ave)/i.test(t)) {
    return 'address'
  }
  if (/^(--|___|\.\.\.|signature)/i.test(t) || (t.length < 60 && /^[A-Z][a-z]+ [A-Z]/.test(t))) {
    return 'signature'
  }
  if (t.length === 0) {
    return 'other'
  }
  return 'body'
}

function LetterPreview({ text }: { text: string }) {
  const lines = text.split('\n')
  return (
    <div className="ai-response-editor__preview" role="document" aria-label="AI generated letter preview" aria-readonly="true">
      {lines.map((line, idx) => {
        const kind = classifyLine(line)
        return (
          <p key={idx} className={`ai-response-editor__line ai-response-editor__line--${kind}`}>
            {line.length ? line : '\u00a0'}
          </p>
        )
      })}
    </div>
  )
}

export default function AIResponseEditor({
  subscriptionLabel,
  originalAiText,
  isGenerating = false,
  generationStatusText,
  enableTypewriter = true,
  defaultRecipientEmail = '',
  onSendEmail,
  sentCtaLabel = 'Mark as sent ✓',
}: AIResponseEditorProps) {
  const [draftText, setDraftText] = useState(originalAiText)
  const [typedPreview, setTypedPreview] = useState('')
  const [compareIndex, setCompareIndex] = useState(0)
  const [versions, setVersions] = useState<TextVersion[]>([
    {
      id: 'v-ai',
      label: 'Original AI output',
      text: originalAiText,
      savedAt: new Date().toISOString(),
      source: 'ai',
    },
  ])
  const [rating, setRating] = useState<number | null>(null)
  const [emailOpen, setEmailOpen] = useState(false)
  const [emailTo, setEmailTo] = useState('')
  const [emailSubject, setEmailSubject] = useState(`Regarding ${subscriptionLabel}`)
  const [emailSending, setEmailSending] = useState(false)
  const [emailError, setEmailError] = useState<string | null>(null)

  useEffect(() => {
    setDraftText(originalAiText)
    setVersions([
      {
        id: 'v-ai',
        label: 'Original AI output',
        text: originalAiText,
        savedAt: new Date().toISOString(),
        source: 'ai',
      },
    ])
    setRating(null)
  }, [originalAiText])

  useEffect(() => {
    if (isGenerating) {
      setTypedPreview('')
      return
    }
    if (!enableTypewriter) {
      setTypedPreview(originalAiText)
      return
    }
    if (!originalAiText) {
      setTypedPreview('')
      return
    }
    let i = 0
    const id = window.setInterval(() => {
      i = Math.min(originalAiText.length, i + 3)
      setTypedPreview(originalAiText.slice(0, i))
      if (i >= originalAiText.length) {
        window.clearInterval(id)
      }
    }, 14)
    return () => window.clearInterval(id)
  }, [isGenerating, originalAiText, enableTypewriter])

  useEffect(() => {
    if (defaultRecipientEmail) {
      setEmailTo(defaultRecipientEmail)
    }
  }, [defaultRecipientEmail])

  const readability = useMemo(() => computeReadabilityScore(draftText), [draftText])
  const charCount = draftText.length

  const recordVersionIfChanged = useCallback(() => {
    setVersions((prev) => {
      const last = prev[prev.length - 1]
      if (last && last.text === draftText) {
        return prev
      }
      const entry: TextVersion = {
        id: `v-${Date.now()}`,
        label: 'Edited draft',
        text: draftText,
        savedAt: new Date().toISOString(),
        source: 'user',
      }
      return [...prev, entry]
    })
  }, [draftText])

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(draftText)
    toast.success('Copied')
  }, [draftText])

  const handleDownloadPdf = useCallback(() => {
    const doc = new jsPDF({ unit: 'pt', format: 'letter' })
    const margin = 48
    const lineHeight = 14
    const pageHeight = doc.internal.pageSize.getHeight()
    const maxWidth = doc.internal.pageSize.getWidth() - margin * 2
    const lines = doc.splitTextToSize(draftText, maxWidth) as string[]
    let y = margin
    for (const line of lines) {
      if (y > pageHeight - margin) {
        doc.addPage()
        y = margin
      }
      doc.text(line, margin, y)
      y += lineHeight
    }
    doc.save(`${subscriptionLabel.replace(/\s+/g, '_')}_letter.pdf`)
  }, [draftText, subscriptionLabel])

  const handleShare = useCallback(async () => {
    if (typeof navigator === 'undefined' || !navigator.share) {
      return
    }
    try {
      await navigator.share({
        title: `${subscriptionLabel} — letter draft`,
        text: draftText,
      })
    } catch {
      /* dismissed */
    }
  }, [draftText, subscriptionLabel])

  const handleSendEmail = useCallback(async () => {
    setEmailError(null)
    if (!emailTo.trim()) {
      setEmailError('Recipient email is required.')
      return
    }
    setEmailSending(true)
    try {
      await onSendEmail?.({ to: emailTo.trim(), subject: emailSubject.trim(), body: draftText })
      setEmailOpen(false)
      toast.success('Send queued (demo)')
    } catch (e) {
      setEmailError(e instanceof Error ? e.message : 'Unable to send email.')
    } finally {
      setEmailSending(false)
    }
  }, [draftText, emailSubject, emailTo, onSendEmail])

  const tileBase: CSSProperties = {
    borderRadius: 16,
    border: '2px solid var(--sl-line)',
    padding: '1.1rem 1.15rem',
    boxShadow: 'var(--sl-shadow-sm)',
    background: 'var(--sl-surface-3)',
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div className="sl-switcher" role="tablist" aria-label="Compare mode">
        <button type="button" role="tab" aria-selected={compareIndex === 0} data-on={compareIndex === 0} onClick={() => setCompareIndex(0)}>
          Side-by-side
        </button>
        <button type="button" role="tab" aria-selected={compareIndex === 1} data-on={compareIndex === 1} onClick={() => setCompareIndex(1)}>
          Compare (diff)
        </button>
      </div>

      {compareIndex === 0 ? (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '1rem',
            alignItems: 'stretch',
          }}
        >
          <div style={tileBase}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
              <span
                style={{
                  fontSize: '0.65rem',
                  fontWeight: 800,
                  letterSpacing: '0.04em',
                  padding: '0.2rem 0.5rem',
                  borderRadius: 999,
                  border: '2px solid var(--sl-line)',
                  background: '#e9d5ff',
                }}
              >
                🤖 AI generated
              </span>
              <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--sl-muted)' }}>What we suggest</span>
            </div>
            {isGenerating ? (
              <p style={{ margin: 0, fontWeight: 700, color: 'var(--sl-muted)' }}>{generationStatusText ?? 'Generating…'}</p>
            ) : (
              <LetterPreview text={typedPreview || '\u00a0'} />
            )}
          </div>
          <div style={{ ...tileBase, background: 'var(--sl-surface)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
              <span
                style={{
                  fontSize: '0.65rem',
                  fontWeight: 800,
                  letterSpacing: '0.04em',
                  padding: '0.2rem 0.5rem',
                  borderRadius: 999,
                  border: '2px solid var(--sl-line)',
                  background: '#99f6e4',
                }}
              >
                ✏️ Your version
              </span>
              <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--sl-muted)' }}>Make it yours</span>
            </div>
            <label htmlFor="ai-response-editor-textarea" className="sl-sr-only">
              Your letter
            </label>
            <textarea
              id="ai-response-editor-textarea"
              className="sl-textarea"
              rows={16}
              value={draftText}
              onChange={(e) => setDraftText(e.target.value)}
              onBlur={recordVersionIfChanged}
              aria-describedby="ai-response-editor-metrics"
            />
            <p style={{ margin: '0.5rem 0 0', fontSize: '0.75rem', color: 'var(--sl-muted)', fontWeight: 600 }}>
              💡 Tip: Most companies respond within 24–48 hours.
            </p>
            <p id="ai-response-editor-metrics" style={{ margin: '0.35rem 0 0', fontSize: '0.75rem', color: 'var(--sl-muted)' }}>
              {charCount} characters · Readability: {readability}
            </p>
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
          <div style={tileBase}>
            <h3 style={{ margin: '0 0 0.5rem', fontFamily: 'var(--sl-font-serif)' }}>AI original</h3>
            <pre className="ai-response-editor__diff-block" aria-label="Original AI text">
              {originalAiText}
            </pre>
          </div>
          <div style={tileBase}>
            <h3 style={{ margin: '0 0 0.5rem', fontFamily: 'var(--sl-font-serif)' }}>Your edits</h3>
            <pre className="ai-response-editor__diff-block" aria-label="Edited text">
              {draftText}
            </pre>
          </div>
        </div>
      )}

      {compareIndex === 1 ? (
        <div style={tileBase}>
          <label htmlFor="ai-response-editor-textarea-diff" style={{ fontWeight: 800, display: 'block', marginBottom: '0.35rem' }}>
            Editable response
          </label>
          <textarea
            id="ai-response-editor-textarea-diff"
            className="sl-textarea"
            rows={12}
            value={draftText}
            onChange={(e) => setDraftText(e.target.value)}
            onBlur={recordVersionIfChanged}
            aria-describedby="ai-response-editor-metrics-diff"
          />
          <p id="ai-response-editor-metrics-diff" style={{ margin: '0.35rem 0 0', fontSize: '0.75rem', color: 'var(--sl-muted)' }}>
            {charCount} characters · Readability: {readability}
          </p>
          <p style={{ margin: '0.35rem 0 0', fontSize: '0.75rem', color: 'var(--sl-muted)' }}>
            Edit below; the compare view above updates as you type.
          </p>
        </div>
      ) : null}

      <div style={{ ...tileBase, background: 'var(--sl-surface)' }}>
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem',
          }}
        >
          <div role="radiogroup" aria-label="Rate letter quality from one to five stars">
            <p id="ai-rating-label" style={{ margin: '0 0 0.35rem', fontWeight: 800, fontSize: '0.875rem' }}>
              How was this letter?
            </p>
            <div style={{ display: 'flex', gap: '0.15rem' }} aria-labelledby="ai-rating-label">
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  key={value}
                  type="button"
                  role="radio"
                  aria-checked={rating === value}
                  aria-label={`${value} out of five stars`}
                  onClick={() => setRating(value)}
                  style={{
                    border: '2px solid var(--sl-line)',
                    borderRadius: 8,
                    width: 40,
                    height: 40,
                    background: 'var(--sl-surface)',
                    cursor: 'pointer',
                    fontSize: '1.15rem',
                    lineHeight: 1,
                  }}
                >
                  {value <= (rating ?? 0) ? '★' : '☆'}
                </button>
              ))}
            </div>
          </div>
          <button type="button" className="sl-btn sl-btn--yellow" onClick={() => toast.success('Saved (demo)')}>
            {sentCtaLabel}
          </button>
        </div>

        <div style={{ marginTop: '1.25rem' }}>
          <p style={{ margin: '0 0 0.35rem', fontWeight: 800, fontSize: '0.75rem', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            Version history
          </p>
          <ol className="ai-response-editor__versions" aria-label="Saved versions newest last">
            {versions.map((v) => (
              <li key={v.id}>
                <button
                  type="button"
                  className="ai-response-editor__version-link"
                  onClick={() => setDraftText(v.text)}
                  aria-label={`Load version ${v.label} from ${v.savedAt}`}
                >
                  <strong>{v.label}</strong> ({v.source}) — {new Date(v.savedAt).toLocaleString()}
                </button>
              </li>
            ))}
          </ol>
        </div>

        <div className="sl-btn-row" style={{ marginTop: '1rem' }}>
          <button type="button" className="sl-btn sl-btn--ghost" onClick={handleCopy}>
            Copy
          </button>
          <button type="button" className="sl-btn sl-btn--black" onClick={() => setEmailOpen(true)}>
            Email
          </button>
          <button type="button" className="sl-btn sl-btn--ghost" onClick={handleDownloadPdf}>
            PDF
          </button>
          {typeof navigator !== 'undefined' && typeof navigator.share === 'function' ? (
            <button type="button" className="sl-btn sl-btn--ghost" onClick={() => void handleShare()}>
              Share
            </button>
          ) : null}
        </div>
      </div>

      <NeoModal
        open={emailOpen}
        title="Send letter"
        onClose={() => !emailSending && setEmailOpen(false)}
        footer={
          <div className="sl-btn-row" style={{ marginTop: '1.25rem', justifyContent: 'flex-end', width: '100%' }}>
            <button type="button" className="sl-btn sl-btn--ghost" disabled={emailSending} onClick={() => setEmailOpen(false)}>
              Cancel
            </button>
            <button type="button" className="sl-btn sl-btn--black" disabled={emailSending} onClick={() => void handleSendEmail()}>
              {emailSending ? 'Sending…' : 'Send'}
            </button>
          </div>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {emailError ? (
            <p role="alert" style={{ margin: 0, fontWeight: 700, color: 'var(--sl-coral)' }}>
              {emailError}
            </p>
          ) : null}
          <div>
            <label htmlFor="email-to" style={{ display: 'block', fontWeight: 800, fontSize: '0.75rem', marginBottom: '0.25rem' }}>
              Recipient
            </label>
            <input
              id="email-to"
              className="sl-input"
              type="email"
              value={emailTo}
              onChange={(e) => setEmailTo(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="email-subject" style={{ display: 'block', fontWeight: 800, fontSize: '0.75rem', marginBottom: '0.25rem' }}>
              Subject
            </label>
            <input id="email-subject" className="sl-input" value={emailSubject} onChange={(e) => setEmailSubject(e.target.value)} />
          </div>
          <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--sl-muted)' }}>Delivery uses your integration hook (onSendEmail).</p>
        </div>
      </NeoModal>
    </div>
  )
}

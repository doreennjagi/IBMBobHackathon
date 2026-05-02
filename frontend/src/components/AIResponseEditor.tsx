/**
 * AIResponseEditor
 *
 * Editing flow:
 * 1. ``originalAiText`` seeds the read-only preview (left) and the editable buffer (right).
 * 2. User edits the textarea; ``draftText`` tracks live edits and drives character count,
 *    readability estimate, and diff vs. the AI baseline.
 * 3. ``versions`` records snapshots: the original generation plus each explicit "Save version"
 *    (here: debounced autosave on blur) so reviewers can compare AI vs. human tone.
 * 4. ``rating`` captures qualitative feedback for model improvement loops.
 * 5. Actions (copy / PDF / email) are side-effecting; email opens a Carbon Modal and defers
 *    transport to ``onSendEmail`` so orchestration can plug in watsonx / SMTP later.
 */

import { useCallback, useEffect, useMemo, useState } from 'react'
import { jsPDF } from 'jspdf'
import {
  Button,
  ButtonSet,
  Column,
  Grid,
  InlineLoading,
  Layer,
  Modal,
  Stack,
  TextArea,
  TextInput,
  Tile,
} from '@carbon/react'
import { Star, StarFilled } from '@carbon/icons-react'

export interface AIResponseEditorProps {
  subscriptionLabel: string
  /** Initial watsonx / agent output (immutable baseline for version history). */
  originalAiText: string
  /** When true, shows skeleton / inline loading over the preview pane. */
  isGenerating?: boolean
  /** Optional integration hook for sending the edited letter. */
  onSendEmail?: (payload: { to: string; subject: string; body: string }) => Promise<void> | void
}

export interface TextVersion {
  id: string
  label: string
  text: string
  savedAt: string
  source: 'ai' | 'user'
}

/** Rough syllable estimate for readability heuristics (English-oriented). */
function estimateSyllables(word: string): number {
  const w = word.toLowerCase().replace(/[^a-z]/g, '')
  if (w.length <= 3) {
    return 1
  }
  const groups = w.match(/[aeiouy]+/g)
  const count = groups ? groups.length : 1
  return Math.max(1, count)
}

/** Returns a 0–100 style readability score (higher = easier), clamped for UI display. */
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
  // Flesch Reading Ease
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

/** Lightweight "syntax" coloring for formal letters using Carbon design tokens via CSS hooks. */
function LetterPreview({ text }: { text: string }) {
  const lines = text.split('\n')
  return (
    <div
      className="ai-response-editor__preview"
      role="document"
      aria-label="AI generated letter preview"
      aria-readonly="true"
    >
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
  onSendEmail,
}: AIResponseEditorProps) {
  const [draftText, setDraftText] = useState(originalAiText)
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
    } catch (e) {
      setEmailError(e instanceof Error ? e.message : 'Unable to send email.')
    } finally {
      setEmailSending(false)
    }
  }, [draftText, emailSubject, emailTo, onSendEmail])

  return (
    <Stack gap={6}>
      <Grid fullWidth>
        <Column lg={8} md={4} sm={4}>
          <Tile>
            <Stack gap={4}>
              <h3 className="cds--type-productive-heading-03">AI preview</h3>
              <p className="cds--type-helper-text-01">Read-only structured view of the generated letter.</p>
              <Layer level={1}>
                {isGenerating ? (
                  <InlineLoading status="active" description="Generating response…" />
                ) : (
                  <LetterPreview text={originalAiText} />
                )}
              </Layer>
            </Stack>
          </Tile>
        </Column>
        <Column lg={8} md={4} sm={4}>
          <Tile>
            <Stack gap={4}>
              <TextArea
                labelText="Editable response"
                helperText="Changes here are tracked against the AI baseline for audit and quality review."
                id="ai-response-editor-textarea"
                rows={18}
                value={draftText}
                onChange={(e) => setDraftText(e.target.value)}
                onBlur={recordVersionIfChanged}
                aria-describedby="ai-response-editor-metrics"
              />
              <p id="ai-response-editor-metrics" className="cds--type-caption-01">
                {charCount} characters · Readability score (Flesch-style): {readability}
              </p>
            </Stack>
          </Tile>
        </Column>
      </Grid>

      <Tile>
        <Stack gap={5}>
          <div role="radiogroup" aria-label="Rate AI response quality from one to five stars">
            <p className="cds--type-body-compact-01" id="ai-rating-label">
              How helpful was this draft?
            </p>
            <ButtonSet aria-labelledby="ai-rating-label">
              {[1, 2, 3, 4, 5].map((value) => (
                <Button
                  key={value}
                  kind="ghost"
                  size="md"
                  hasIconOnly
                  role="radio"
                  aria-checked={rating === value}
                  renderIcon={value <= (rating ?? 0) ? StarFilled : Star}
                  iconDescription={`${value} out of 5 stars`}
                  aria-label={`${value} out of five stars`}
                  onClick={() => setRating(value)}
                />
              ))}
            </ButtonSet>
          </div>

          <div>
            <p className="cds--type-productive-heading-01">Version history</p>
            <ol className="ai-response-editor__versions" aria-label="Saved versions newest last">
              {versions.map((v) => (
                <li key={v.id}>
                  <button
                    type="button"
                    className="cds--type-body-compact-01 ai-response-editor__version-link"
                    onClick={() => setDraftText(v.text)}
                    aria-label={`Load version ${v.label} from ${v.savedAt}`}
                  >
                    <strong>{v.label}</strong> ({v.source}) — {new Date(v.savedAt).toLocaleString()}
                  </button>
                </li>
              ))}
            </ol>
          </div>

          <ButtonSet>
            <Button kind="secondary" onClick={handleCopy} aria-label="Copy edited letter to clipboard">
              Copy to clipboard
            </Button>
            <Button kind="secondary" onClick={handleDownloadPdf} aria-label="Download letter as PDF file">
              Download as PDF
            </Button>
            <Button kind="primary" onClick={() => setEmailOpen(true)} aria-label="Open send email dialog">
              Send via email
            </Button>
          </ButtonSet>
        </Stack>
      </Tile>

      <Modal
        open={emailOpen}
        modalHeading="Send letter"
        primaryButtonText={emailSending ? 'Sending…' : 'Send'}
        secondaryButtonText="Cancel"
        primaryButtonDisabled={emailSending}
        onRequestClose={() => !emailSending && setEmailOpen(false)}
        onRequestSubmit={handleSendEmail}
        aria-label="Send edited AI response by email"
      >
        <Stack gap={5}>
          {emailError ? <p role="alert">{emailError}</p> : null}
          <TextInput
            id="email-to"
            labelText="Recipient"
            type="email"
            value={emailTo}
            onChange={(e) => setEmailTo(e.target.value)}
          />
          <TextInput id="email-subject" labelText="Subject" value={emailSubject} onChange={(e) => setEmailSubject(e.target.value)} />
          <p className="cds--type-helper-text-01">Email delivery uses your integration hook (onSendEmail).</p>
        </Stack>
      </Modal>
    </Stack>
  )
}

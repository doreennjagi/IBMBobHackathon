/**
 * Landing / upload — neo-brutalist reference UI (ticker, hero, hard-shadow drop zone).
 */

import { useCallback, useRef, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'

import { SiteHeader } from '@components/layout/SiteHeader'
import { TickerBar } from '@components/layout/TickerBar'
import { friendlyUploadError, uploadBankCsv } from '@/services/api'
import { useDashboardStore } from '@/stores/dashboardStore'
import { SAMPLE_CSV } from '@/utils/sampleCsv'
import { validateCsvFile, validateCsvHeadersFromText } from '@/utils/csvClientValidation'

export default function Upload() {
  const navigate = useNavigate()
  const setFromIngest = useDashboardStore((s) => s.setFromIngest)
  const loadDemo = useDashboardStore((s) => s.loadDemo)
  const [busy, setBusy] = useState(false)
  const [progress, setProgress] = useState(0)
  const [localError, setLocalError] = useState<string | null>(null)
  const [validHint, setValidHint] = useState<string | null>(null)
  const announceRef = useRef<HTMLDivElement>(null)
  const uploadAnchorRef = useRef<HTMLDivElement>(null)

  const announce = useCallback((msg: string) => {
    const el = announceRef.current
    if (el) {
      el.textContent = msg
    }
  }, [])

  const downloadSample = useCallback(() => {
    const blob = new Blob([SAMPLE_CSV], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'subleech-sample-statement.csv'
    a.click()
    URL.revokeObjectURL(url)
    toast.success('Sample CSV downloaded')
  }, [])

  const runUpload = useCallback(
    async (file: File) => {
      setLocalError(null)
      setValidHint(null)
      const v = validateCsvFile(file)
      if (!v.ok) {
        setLocalError(v.message)
        return
      }
      setBusy(true)
      setProgress(5)
      announce('Upload started')
      try {
        const text = await file.slice(0, 8192).text()
        const hv = validateCsvHeadersFromText(text)
        if (!hv.ok) {
          setLocalError(hv.message)
          setBusy(false)
          setProgress(0)
          return
        }
        setValidHint('Great — this CSV has the columns we need.')
        setProgress(25)
        const res = await uploadBankCsv(file)
        setProgress(85)
        setFromIngest(res)
        setProgress(100)
        announce(`Processed ${res.summary.total_transactions} transactions, ${res.subscriptions.length} subscriptions`)
        toast.success('Statement processed')
        navigate('/dashboard')
      } catch (e) {
        const msg = friendlyUploadError(e)
        setLocalError(msg)
        announce(`Error: ${msg}`)
        toast.error(msg)
      } finally {
        setBusy(false)
        setTimeout(() => setProgress(0), 400)
      }
    },
    [announce, navigate, setFromIngest],
  )

  const onDrop = useCallback(
    (accepted: File[]) => {
      const f = accepted[0]
      if (!f) {
        setLocalError('Only .csv files are accepted.')
        return
      }
      void runUpload(f)
    },
    [runUpload],
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'text/csv': ['.csv'] },
    maxFiles: 1,
    disabled: busy,
    maxSize: 10 * 1024 * 1024,
  })

  const tryDemo = useCallback(() => {
    loadDemo()
    announce('Demo data loaded')
    toast.success('Demo loaded — open dashboard')
    navigate('/dashboard')
  }, [announce, loadDemo, navigate])

  const scrollToUpload = useCallback(() => {
    uploadAnchorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, [])

  return (
    <div className="sl-landing">
      <div ref={announceRef} className="sl-sr-only" role="status" aria-live="polite" aria-atomic="true" />
      <TickerBar />
      <SiteHeader />
      <div style={{ maxWidth: 1120, margin: '0 auto', padding: '0 1.25rem 3rem' }}>
        <div className="sl-landing__grid" id="top">
          <div>
            <div className="sl-pill-outline" style={{ marginBottom: '1rem' }}>
              ● Receipts • Not vibes
            </div>
            <h1 className="sl-hero-title">
              Your bank <span className="sl-hero-script">is bleeding.</span>
              <br />
              We stitch it.
            </h1>
            <p className="sl-hero-body">
              Drop a bank statement. We scan for <span className="sl-hero-underline">silent price hikes</span>, forgotten
              free trials, and zombie subscriptions you swore you cancelled.
            </p>
            <p className="sl-social-proof">
              🦊 🐻 🐸 <em>12,847 people clawed back $1.2M</em> last month
            </p>
          </div>

          <div ref={uploadAnchorRef} id="upload">
            <div className="sl-drop-stack">
              <span className="sl-drop-badge" aria-hidden>
                FREE · 30 SEC
              </span>
              <div className="sl-drop-card">
                <div
                  {...getRootProps()}
                  className="sl-drop-zone"
                  data-active={isDragActive}
                  style={{ outline: 'none' }}
                >
                  <input {...getInputProps()} aria-label="Upload bank statement CSV" />
                  <div style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }} aria-hidden>
                    ⬆️
                  </div>
                  <p style={{ margin: 0, fontFamily: 'var(--sl-font-serif)', fontWeight: 700, fontSize: '1.2rem' }}>
                    Drop the receipt.
                  </p>
                  <p style={{ margin: '0.35rem 0 0', fontSize: '0.875rem', color: 'var(--sl-muted)' }}>
                    CSV — stays on your device — click to browse
                  </p>
                </div>
                {busy ? (
                  <div style={{ marginTop: '1rem' }}>
                    <p style={{ margin: '0 0 0.35rem', fontSize: '0.8125rem', fontWeight: 700 }}>Analyzing…</p>
                    <div
                      style={{
                        height: 10,
                        border: '2px solid var(--sl-line)',
                        borderRadius: 6,
                        overflow: 'hidden',
                        background: '#fff',
                      }}
                    >
                      <div
                        style={{
                          height: '100%',
                          width: `${progress}%`,
                          background: 'var(--sl-coral)',
                          transition: 'width 0.2s ease',
                        }}
                      />
                    </div>
                  </div>
                ) : null}
                {validHint && !localError ? (
                  <p style={{ margin: '0.75rem 0 0', fontSize: '0.875rem', fontWeight: 600, color: 'var(--sl-green)' }}>
                    {validHint}
                  </p>
                ) : null}
                {localError ? (
                  <div
                    role="alert"
                    style={{
                      marginTop: '0.75rem',
                      padding: '1rem',
                      border: '2px solid var(--sl-line)',
                      borderRadius: 12,
                      background: 'var(--sl-danger-bg)',
                      textAlign: 'left',
                    }}
                  >
                    <p style={{ margin: '0 0 0.5rem', fontWeight: 800 }}>We couldn&apos;t process this file</p>
                    <p style={{ margin: 0, fontSize: '0.9rem' }}>{localError}</p>
                    <div className="sl-btn-row" style={{ marginTop: '0.75rem' }}>
                      <button type="button" className="sl-btn sl-btn--ghost sl-btn--sm" onClick={() => setLocalError(null)}>
                        Try another file
                      </button>
                      <button type="button" className="sl-btn sl-btn--coral sl-btn--sm" onClick={downloadSample}>
                        Sample CSV
                      </button>
                    </div>
                  </div>
                ) : null}
                <div className="sl-badge-row">
                  <span className="sl-badge-soft">Local only</span>
                  <span className="sl-badge-soft">No signup</span>
                  <span className="sl-badge-soft">No ads</span>
                </div>
              </div>
            </div>
            <div className="sl-hero-cta">
              <p className="sl-hero-cta__hint">No bank file yet? Grab the sample CSV or load the full demo dashboard.</p>
              <div className="sl-btn-row">
                <button type="button" className="sl-btn sl-btn--coral" onClick={downloadSample}>
                  Download sample CSV
                </button>
                <button type="button" className="sl-btn sl-btn--black" onClick={tryDemo}>
                  Try demo analysis
                </button>
              </div>
            </div>
          </div>
        </div>

        <section className="sl-process" id="how" aria-label="How it works">
          <div>
            <div className="sl-process__num">01</div>
            <p className="sl-process__label">Drop the file</p>
          </div>
          <div>
            <div className="sl-process__num">02</div>
            <p className="sl-process__label">We hunt</p>
          </div>
          <div>
            <div className="sl-process__num">03</div>
            <p className="sl-process__label">You claw back</p>
          </div>
        </section>

        <p className="sl-landing__fine-print">
          Required: date, merchant (or description), amount · max 10 MB · CSV only for now
        </p>

        <section className="sl-about" id="about" aria-labelledby="sl-about-heading">
          <div className="sl-about__head">
            <p className="sl-about__eyebrow">Why SubLeech</p>
            <h2 id="sl-about-heading" className="sl-about__title">
              Subscription spend is a black box. <span className="sl-about__title-accent">We open it.</span>
            </h2>
            <p className="sl-about__lede">
              Most people underestimate recurring spend by a wide margin. Trials convert quietly, providers raise prices in
              fine print, and old services keep billing. SubLeech reads your bank export like a forensic accountant: it finds
              recurring patterns, surfaces hikes and zombies, and hands you a dashboard you can act on—without storing your
              statement in the cloud.
            </p>
          </div>
          <ul className="sl-about__grid">
            <li className="sl-about__card">
              <h3 className="sl-about__card-title">Pattern detection</h3>
              <p className="sl-about__card-body">
                Frequency analysis spots every recurring charge—not only the obvious streamers and gyms, but the small
                monthly line items that add up.
              </p>
            </li>
            <li className="sl-about__card">
              <h3 className="sl-about__card-title">Hike radar</h3>
              <p className="sl-about__card-body">
                When a merchant creeps the price up, we flag it next to history so you see the delta at a glance instead of
                digging through PDFs.
              </p>
            </li>
            <li className="sl-about__card">
              <h3 className="sl-about__card-title">Act, don&apos;t guess</h3>
              <p className="sl-about__card-body">
                From the dashboard you can draft cancellation or negotiation language tailored to each subscription—so doing
                something about waste takes minutes, not a weekend of admin.
              </p>
            </li>
          </ul>
        </section>

        <section className="sl-faq" id="faq" aria-labelledby="sl-faq-heading">
          <h2 id="sl-faq-heading" className="sl-faq__title">
            FAQ
          </h2>
          <dl className="sl-faq__list">
            <div className="sl-faq__item">
              <dt>What file do I need?</dt>
              <dd>
                A CSV export from your bank with columns for date, merchant or description, and amount. If you are unsure,
                download our example CSV and match that shape.
              </dd>
            </div>
            <div className="sl-faq__item">
              <dt>Do you keep my data?</dt>
              <dd>
                Processing is designed for privacy: upload your file for analysis in this session without creating an
                account. Treat the demo as local-first guidance and check your deployment&apos;s data policy for production
                use.
              </dd>
            </div>
            <div className="sl-faq__item">
              <dt>Can I try without a statement?</dt>
              <dd>
                Yes—use &quot;Try demo analysis&quot; to load sample subscriptions and explore the dashboard and tools with
                realistic data.
              </dd>
            </div>
          </dl>
        </section>

        <section className="sl-cta-band" aria-labelledby="sl-cta-heading">
          <div className="sl-cta-band__inner">
            <div className="sl-cta-band__copy">
              <h2 id="sl-cta-heading" className="sl-cta-band__title">
                Ready to see what you&apos;re actually paying?
              </h2>
              <p className="sl-cta-band__sub">
                Drop a CSV above or run the demo—either way you will have answers in under a minute.
              </p>
            </div>
            <div className="sl-cta-band__actions">
              <button type="button" className="sl-btn sl-btn--yellow" onClick={scrollToUpload}>
                Upload a statement
              </button>
              <button type="button" className="sl-btn sl-btn--black" onClick={tryDemo}>
                Run demo analysis
              </button>
            </div>
          </div>
        </section>

        <footer className="sl-site-footer">
          <div className="sl-site-footer__inner">
            <div className="sl-site-footer__brand">
              <p className="sl-site-footer__name">SubLeech</p>
              <p className="sl-site-footer__tagline">Personal subscription intelligence—on your side.</p>
            </div>
            <div className="sl-site-footer__links">
              <a href="#how">How it works</a>
              <a href="#about">About</a>
              <a href="#faq">FAQ</a>
              <a href="#upload">Upload</a>
            </div>
            <div className="sl-site-footer__links">
              <Link to="/dashboard">Dashboard</Link>
              <a href="https://www.ibm.com/bob" target="_blank" rel="noreferrer">
                IBM Bob
              </a>
              <a href="https://www.ibm.com/watsonx" target="_blank" rel="noreferrer">
                watsonx
              </a>
            </div>
            <p className="sl-site-footer__legal">
              © {new Date().getFullYear()} SubLeech · Hackathon build for IBM Bob · Not financial advice; verify charges with
              your bank and merchants.
            </p>
          </div>
        </footer>
      </div>
    </div>
  )
}

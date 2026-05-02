/**
 * AIEditor route: hosts AIResponseEditor for cancellation / negotiation drafts.
 * Reads ``subscriptionId`` and optional ``intent`` query to tailor sample content.
 */

import { useMemo } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { Content, Grid, Column, Stack, InlineNotification } from '@carbon/react'

import AIResponseEditor from '@components/AIResponseEditor'

const SAMPLE_CANCEL = `2025-05-02

StreamVault Billing
123 Market Street
San Francisco, CA

Dear StreamVault Billing,

Re: Cancellation of StreamVault Plus subscription (account ending 4821)

Please cancel my StreamVault Plus subscription effective immediately. I request written confirmation that no further charges will be processed.

Sincerely,
Alex Rivera`

const SAMPLE_NEGOTIATE = `2025-05-02

MegaMobile Customer Relations
PO Box 900
Chicago, IL

Dear MegaMobile Customer Relations,

Re: Account #77821 — request for loyalty adjustment

I am writing to discuss my wireless plan pricing following recent increases. Given my tenure of 36 months with on-time payments, I would appreciate a review for a promotional rate or equipment credit.

Respectfully,
Alex Rivera`

export default function AIEditor() {
  const { subscriptionId } = useParams<{ subscriptionId: string }>()
  const [searchParams] = useSearchParams()
  const intent = searchParams.get('intent') ?? 'cancel'

  const original = useMemo(
    () => (intent === 'negotiate' ? SAMPLE_NEGOTIATE : SAMPLE_CANCEL),
    [intent],
  )

  const label = subscriptionId ? decodeURIComponent(subscriptionId) : 'subscription'

  return (
    <Content>
      <Grid fullWidth narrow>
        <Column lg={10} md={6} sm={4}>
          <Stack gap={6}>
            <header>
              <h1 className="cds--type-productive-heading-04">AI response editor</h1>
              <p className="cds--type-body-01">
                Subscription: <strong>{label}</strong> · Intent:{' '}
                <strong>{intent === 'negotiate' ? 'Negotiation' : 'Cancellation'}</strong>
              </p>
            </header>
            <InlineNotification kind="info" title="Demo content" subtitle="Letter text is static sample data until the agents API is connected." lowContrast hideCloseButton />
            <AIResponseEditor
              subscriptionLabel={label}
              originalAiText={original}
              onSendEmail={async ({ to, subject, body }) => {
                // Hook for watsonx Orchestrate / SMTP / SendGrid integration.
                console.info('[email stub]', { to, subject, bodyLength: body.length })
              }}
            />
          </Stack>
        </Column>
      </Grid>
    </Content>
  )
}

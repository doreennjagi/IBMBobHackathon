import { Component, type ErrorInfo, type ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  error: Error | null
}

/**
 * Catches render errors so users never see a blank screen or raw stack in production demos.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('SubLeech UI error boundary', error, info.componentStack)
  }

  render(): ReactNode {
    if (this.state.error) {
      return (
        <div className="error-boundary-tile">
          <h1 style={{ margin: '0 0 0.75rem', fontFamily: 'var(--sl-font-serif)', fontSize: '1.5rem' }}>Something went wrong</h1>
          <p style={{ margin: '0 0 1.25rem', color: 'var(--sl-muted)', lineHeight: 1.55 }}>
            The app hit an unexpected error. You can reload the page or return to the upload screen.
          </p>
          <button
            type="button"
            className="sl-btn sl-btn--black"
            onClick={() => {
              this.setState({ error: null })
              window.location.assign('/')
            }}
          >
            Go to home
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

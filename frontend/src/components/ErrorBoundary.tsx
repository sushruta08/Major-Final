import { Component, type ReactNode } from 'react'

interface Props { children: ReactNode }
interface State { hasError: boolean; error: string }

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: '' }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error: error.message }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-dark-950 flex items-center justify-center p-6">
          <div className="bg-dark-800/60 border border-red-500/30 rounded-xl p-8 max-w-lg w-full text-center">
            <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-4">
              <span className="text-red-400 text-2xl">⚠</span>
            </div>
            <h2 className="text-lg font-bold text-slate-100 mb-2">Something went wrong</h2>
            <p className="text-sm text-slate-400 mb-6 font-mono bg-dark-900 rounded p-2">
              {this.state.error || 'An unexpected error occurred'}
            </p>
            <div className="space-y-2">
              <button
                onClick={() => { this.setState({ hasError: false, error: '' }); window.location.href = '/dashboard' }}
                className="w-full bg-cyber-600 hover:bg-cyber-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all"
              >
                Go to Dashboard
              </button>
              <button
                onClick={() => window.location.reload()}
                className="w-full bg-dark-700 hover:bg-dark-600 text-slate-200 px-4 py-2 rounded-lg text-sm font-medium transition-all"
              >
                Reload Page
              </button>
            </div>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

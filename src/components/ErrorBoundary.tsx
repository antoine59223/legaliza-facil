import { Component, type ErrorInfo, type ReactNode } from 'react';


interface Props { children: ReactNode; }
interface State { hasError: boolean; error?: Error; }

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('ErrorBoundary caught:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[100dvh] bg-zinc-950 p-8 text-center">
          <div className="glass-panel rounded-3xl p-8 max-w-md w-full border border-red-500/20">
            <div className="text-5xl mb-4">⚠️</div>
            <h2 className="text-white text-xl font-bold mb-2">Algo correu mal</h2>
            <p className="text-zinc-400 text-sm mb-6 leading-relaxed">
              Ocorreu um erro inesperado. Por favor recarregue a página e tente novamente.<br />
              Se o problema persistir, contacte o suporte.
            </p>
            <button
              onClick={() => { this.setState({ hasError: false }); window.location.reload(); }}
              className="bg-blue-600 hover:bg-blue-500 text-white font-semibold px-6 py-3 rounded-xl transition-all"
            >
              Recarregar Página
            </button>
            {this.state.error && (
              <p className="text-zinc-600 text-xs mt-4 font-mono break-all">
                {this.state.error.message}
              </p>
            )}
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
    errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error, errorInfo: null };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error("Uncaught error:", error, errorInfo);
        this.setState({ errorInfo });
        // Here you would typically log to an external service like Sentry
    }

    handleReload = () => {
        window.location.reload();
    };

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
                    <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden animate-fade-in">
                        <div className="bg-rose-500 p-6 flex justify-center">
                            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                                <AlertCircle className="w-10 h-10 text-white" />
                            </div>
                        </div>

                        <div className="p-8 text-center space-y-4">
                            <h2 className="text-2xl font-bold text-slate-800">Algo deu errado!</h2>
                            <p className="text-slate-500 text-sm leading-relaxed">
                                Desculpe, encontramos um erro inesperado ao processar sua solicitação. O sistema registrou occorrência para análise.
                            </p>

                            {this.state.error && (
                                <div className="mt-4 p-3 bg-red-50 rounded-lg text-left border border-red-100 overflow-auto max-h-32">
                                    <p className="text-xs font-mono text-red-700 break-all">
                                        {this.state.error.toString()}
                                    </p>
                                </div>
                            )}

                            <div className="pt-4">
                                <button
                                    onClick={this.handleReload}
                                    className="w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold py-3 px-6 rounded-xl transition-all active:scale-95"
                                >
                                    <RefreshCw className="w-4 h-4" />
                                    Tentar Novamente
                                </button>
                            </div>
                        </div>

                        <div className="bg-slate-50 p-4 text-center border-t border-slate-100">
                            <p className="text-xs text-slate-400 font-medium">Erro: UI_RENDER_FAILURE</p>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

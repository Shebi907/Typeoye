import React, { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RotateCcw, ArrowLeft } from 'lucide-react';

interface GameErrorBoundaryProps {
  onBack?: () => void;
  children: ReactNode;
}

interface GameErrorBoundaryState {
  error: Error | null;
}

export default class GameErrorBoundary extends Component<GameErrorBoundaryProps, GameErrorBoundaryState> {
  state: GameErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): GameErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('Game crashed:', error.message, info.componentStack);
  }

  render(): ReactNode {
    const { error } = this.state;
    if (!error) return this.props.children;

    return (
      <div className="card p-8 max-w-md mx-auto text-center">
        <div
          className="w-12 h-12 rounded-2xl mx-auto flex items-center justify-center mb-4"
          style={{ backgroundColor: 'rgba(239, 68, 68, 0.12)', color: '#EF4444' }}
        >
          <AlertTriangle size={22} />
        </div>
        <h2 className="text-lg font-extrabold" style={{ color: 'var(--color-text-primary)' }}>
          Something went wrong
        </h2>
        <p className="text-[0.8125rem] mt-1 mb-1" style={{ color: 'var(--color-text-secondary)' }}>
          The game hit an unexpected error. Try again, or head back to the games hub.
        </p>
        <p
          className="text-[0.6875rem] font-mono mt-1 mb-5 px-3 py-2 rounded-lg break-all"
          style={{ backgroundColor: 'rgba(239, 68, 68, 0.06)', color: 'var(--color-text-muted, var(--color-text-secondary))' }}
        >
          {error.message || 'Unknown error'}
        </p>
        <div className="flex gap-2.5 justify-center">
          <button
            onClick={() => this.setState({ error: null })}
            className="flex-1 max-w-[8.75rem] py-2 rounded-xl text-sm font-bold flex items-center justify-center gap-1.5 transition-all duration-150 hover:brightness-110"
            style={{ background: 'linear-gradient(135deg, #4361EE, #3730A3)', color: '#fff', boxShadow: '0 4px 12px rgba(67, 97, 238, 0.3)' }}
          >
            <RotateCcw size={15} /> Try again
          </button>
          {this.props.onBack && (
            <button
              onClick={() => this.props.onBack?.()}
              className="flex-1 max-w-[8.75rem] py-2 rounded-xl text-sm font-bold flex items-center justify-center gap-1.5"
              style={{ color: 'var(--color-text-secondary)', border: '1px solid var(--color-border)' }}
            >
              <ArrowLeft size={15} /> Back to games
            </button>
          )}
        </div>
      </div>
    );
  }
}
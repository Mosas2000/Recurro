'use client';

import React from 'react';

interface Props {
    children: React.ReactNode;
    fallback?: React.ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

/**
 * Generic React error boundary for catching runtime exceptions
 * (e.g. wallet extension conflicts) without crashing the whole page.
 */
export class ErrorBoundary extends React.Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, info: React.ErrorInfo) {
        console.error('[ErrorBoundary]', error, info.componentStack);
    }

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) return this.props.fallback;

            return (
                <div style={{ padding: '2rem', textAlign: 'center' }}>
                    <h2 style={{ marginBottom: '0.5rem' }}>Something went wrong</h2>
                    <p style={{ color: '#666', fontSize: '0.875rem', maxWidth: '480px', margin: '0 auto' }}>
                        A wallet extension conflict may have occurred. Try disabling
                        duplicate Stacks wallet extensions or refreshing the page.
                    </p>
                    <button
                        onClick={() => this.setState({ hasError: false, error: null })}
                        style={{
                            marginTop: '1rem',
                            padding: '0.5rem 1.5rem',
                            borderRadius: '0.375rem',
                            border: '1px solid #ccc',
                            cursor: 'pointer',
                        }}
                    >
                        Try Again
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}

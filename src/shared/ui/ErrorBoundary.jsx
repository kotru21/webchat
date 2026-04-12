import React from "react";

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error) {
    return { error };
  }
  componentDidCatch(error, info) {
    if (process.env.NODE_ENV !== "production") {
      console.error("[ErrorBoundary]", error, info);
    }
    this.props.onError?.(error, info);
  }
  render() {
    if (this.state.error) {
      return (
        this.props.fallback || (
          <div className="m3-surface h-screen w-full flex flex-col items-center justify-center gap-4 p-6 text-center">
            <h1 className="text-xl font-semibold">Произошла ошибка</h1>
            <pre className="m3-surface-high max-w-xl whitespace-pre-wrap rounded-2xl border border-border/70 p-4 text-xs opacity-80">
              {String(this.state.error?.message || this.state.error)}
            </pre>
            <button
              onClick={() => window.location.reload()}
              className="m3-pill bg-primary px-5 py-2 text-sm font-medium text-primary-foreground shadow-[0_1px_3px_hsl(var(--shadow-color)/0.22)] transition hover:brightness-105">
              Перезагрузить
            </button>
          </div>
        )
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;

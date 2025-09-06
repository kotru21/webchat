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
          <div className="w-full h-screen flex flex-col items-center justify-center gap-4 text-center p-6">
            <h1 className="text-xl font-semibold">Произошла ошибка</h1>
            <pre className="text-xs whitespace-pre-wrap max-w-xl opacity-70">
              {String(this.state.error?.message || this.state.error)}
            </pre>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 rounded bg-blue-600 text-white text-sm hover:bg-blue-500">
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

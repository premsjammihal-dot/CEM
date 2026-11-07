import { Component, type ReactNode } from "react";
import { RotateCcw, ZapOff } from "lucide-react";

interface Props {
  children: ReactNode;
}
interface State {
  hasError: boolean;
  message: string;
}

/** Centralized error boundary — any render error lands here instead of a blank page. */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, message: "" };

  static getDerivedStateFromError(err: unknown): State {
    return { hasError: true, message: err instanceof Error ? err.message : "Unexpected error" };
  }

  componentDidCatch(err: unknown): void {
    console.error("[CampusSphere] render error:", err);
  }

  render(): ReactNode {
    if (!this.state.hasError) return this.props.children;
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-base px-6 text-center">
        <div className="mb-5 flex size-16 items-center justify-center rounded-2xl bg-amber-500/12 text-amber-300">
          <ZapOff className="size-8" aria-hidden />
        </div>
        <h1 className="font-display text-2xl font-bold text-ink">Something glitched</h1>
        <p className="mt-2 max-w-md text-sm text-muted">
          The interface hit an unexpected state ({this.state.message}). Reload to re-render from the last persisted data.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="mt-6 inline-flex h-11 items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 px-6 text-sm font-semibold text-white"
        >
          <RotateCcw className="size-4" aria-hidden />
          Reload CampusSphere
        </button>
      </div>
    );
  }
}

import { Component, type ReactNode } from "react";

type Props = { children: ReactNode };
type State = { error: Error | null };

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: { componentStack?: string | null }) {
    console.error("[error-boundary]", error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="min-h-dvh flex flex-col items-center justify-center gap-3 p-6 text-center bg-[var(--color-ink-0)]">
          <div className="text-[11px] tracking-widest text-[var(--color-rose)]">/crash</div>
          <h1 className="text-[18px] font-medium text-[var(--color-fg-0)]">
            something broke<span className="text-[var(--color-rose)]">_</span>
          </h1>
          <pre className="max-w-full overflow-auto text-[10px] text-[var(--color-fg-2)] whitespace-pre-wrap break-words p-3 border border-[var(--color-ink-3)] rounded text-left">
            {this.state.error.name}: {this.state.error.message}
            {this.state.error.stack ? `\n\n${this.state.error.stack.split("\n").slice(0, 6).join("\n")}` : ""}
          </pre>
          <button
            onClick={() => {
              this.setState({ error: null });
              location.reload();
            }}
            className="px-4 py-2 border border-[var(--color-violet-dim)] text-[var(--color-violet)] rounded text-[12px]"
          >
            reload
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

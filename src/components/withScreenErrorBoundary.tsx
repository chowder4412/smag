import { ComponentType } from "react";
import { ErrorBoundary } from "@/components/errors/ErrorBoundary";

export function withScreenErrorBoundary<P extends object>(
  Screen: ComponentType<P>,
  label?: string
): ComponentType<P> {
  return function WrappedScreen(props: P) {
    return (
      <ErrorBoundary fallbackLabel={label ?? "This screen failed to load. Tap to retry."}>
        <Screen {...props} />
      </ErrorBoundary>
    );
  };
}

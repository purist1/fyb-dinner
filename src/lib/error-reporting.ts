// Quantro Software Labs — Error reporting utility
// Reports runtime errors to the console for production monitoring.

type ErrorOptions = {
  mechanism?: "manual" | "onerror" | "unhandledrejection" | "react_error_boundary";
  handled?: boolean;
  severity?: "error" | "warning" | "info";
};

export function reportError(error: unknown, context: Record<string, unknown> = {}) {
  if (typeof window === "undefined") return;

  // Loaders and server fns commonly throw a raw Response; String(it) is the
  // opaque "[object Response]", so pull out the status and URL instead.
  const message =
    error instanceof Response
      ? `Response ${error.status}${error.url ? ` at ${error.url}` : ""}`
      : error instanceof Error
        ? error.message
        : String(error);

  console.error("[Quantro] Runtime error caught by error boundary:", {
    message,
    stack: error instanceof Error ? error.stack : undefined,
    route: typeof window !== "undefined" ? window.location.pathname : undefined,
    ...context,
  });
}

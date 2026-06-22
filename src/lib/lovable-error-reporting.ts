type ErrorOptions = {
  mechanism?: "manual" | "onerror" | "unhandledrejection" | "react_error_boundary";
  handled?: boolean;
  severity?: "error" | "warning" | "info";
};

export function reportError(error: unknown, context: Record<string, unknown> = {}, _options?: ErrorOptions) {
  const route = typeof window !== "undefined" ? window.location.pathname : "server";
  console.error("[Sudut Gawang Error]", error, { route, ...context });
}

/** @deprecated Use reportError instead */
export const reportLovableError = reportError;

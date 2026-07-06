/**
 * Structured error logging utility
 * Logs errors with context for easier debugging and monitoring
 */

interface ErrorContext {
  context: string;
  userId?: string;
  applicationId?: string;
  action?: string;
  error: unknown;
  metadata?: Record<string, unknown>;
}

/**
 * Log a structured error with context
 * In production, this could pipe to Sentry, LogRocket, or similar
 */
export function logError(errorContext: ErrorContext): void {
  const { context, userId, applicationId, action, error, metadata } = errorContext;

  const errorMessage = error instanceof Error ? error.message : String(error);
  const errorStack = error instanceof Error ? error.stack : undefined;

  const logEntry = {
    timestamp: new Date().toISOString(),
    context,
    userId,
    applicationId,
    action,
    error: errorMessage,
    metadata,
    stack: errorStack,
  };

  // Log to console in development
  console.error("[Structured Error]", logEntry);

  // TODO: Send to error tracking service (Sentry, LogRocket, etc.)
  // Sentry.captureException(error, { contexts: { app: logEntry } });
}

/**
 * Log auth-related errors with user context
 */
export function logAuthError(
  action: string,
  error: unknown,
  userId?: string,
  metadata?: Record<string, unknown>
): void {
  logError({
    context: "auth",
    userId,
    action,
    error,
    metadata,
  });
}

/**
 * Log data access errors
 */
export function logDataAccessError(
  action: string,
  error: unknown,
  userId: string,
  entityType: string,
  entityId?: string
): void {
  logError({
    context: "data-access",
    userId,
    applicationId: entityId,
    action,
    error,
    metadata: { entityType },
  });
}

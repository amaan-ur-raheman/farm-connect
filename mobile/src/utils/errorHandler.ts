/**
 * Error Handler Utility
 * Centralized error logging for the mobile app
 */

export const handleError = (
  error: unknown,
  context: string,
  options?: { silent?: boolean; showAlert?: boolean }
): void => {
  const shouldLog = !options?.silent;
  
  if (shouldLog) {
    console.error(`[${context}]`, error);
    
    // In development, log full error details
    if (__DEV__) {
      console.log('[Error Details]', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        context,
      });
    }
  }
  
  // TODO: Implement alert showing if needed
  if (options?.showAlert) {
    // Could integrate with toast/notification system
  }
};

export const getErrorMessage = (error: unknown, fallback = 'An unexpected error occurred'): string => {
  if (error instanceof Error) {
    return error.message || fallback;
  }
  if (typeof error === 'string') {
    return error;
  }
  return fallback;
};

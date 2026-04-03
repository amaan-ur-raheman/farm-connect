/**
 * Error Handler Utility
 * Centralized error logging and user notification for the mobile app
 */
import { Alert } from 'react-native';

export const handleError = (
  error: unknown,
  context: string,
  options?: { silent?: boolean; showAlert?: boolean; customMessage?: string }
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

  if (options?.showAlert) {
    const message = options.customMessage || getErrorMessage(error, 'Something went wrong. Please try again.');
    Alert.alert('Error', message);
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

/**
 * Show an error alert to the user
 */
export const showErrorAlert = (title: string, message: string): void => {
  Alert.alert(title, message);
};

/**
 * Handle API errors with user-friendly messages
 */
export const handleApiError = (error: unknown, context: string): void => {
  const message = getErrorMessage(error, `Failed to ${context}. Please check your connection and try again.`);
  Alert.alert('Connection Error', message);
};

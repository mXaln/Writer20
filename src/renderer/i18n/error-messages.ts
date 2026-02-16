import { msg } from '@lit/localize';

// Error code to localized message mapping
// These messages correspond to error codes from the main process

export const errorMessages: Record<string, string> = {
  // Project errors
  'ERR_PROJECT_EXISTS': msg('A project with this identifier already exists'),
  'ERR_PROJECT_NOT_FOUND': msg('Project not found'),
  'ERR_PROJECT_FOLDER_NOT_FOUND': msg('Project folder not found'),
  'ERR_IMPORT_FILE_NOT_FOUND': msg('Import file not found'),
  'ERR_INVALID_OPTION': msg('Invalid option'),
  
  // File errors
  'ERR_FILE_NOT_FOUND': msg('File not found'),
  
  // Fallback for unknown errors - pass through as-is
  'ERR_UNKNOWN': msg('An unknown error occurred')
};

/**
 * Get localized error message for an error code
 * Falls back to the raw error string if not a known error code
 */
export function getLocalizedError(error: string | undefined | null): string {
  if (!error) {
    return '';
  }
  
  // If it's a known error code, return localized version
  if (error in errorMessages) {
    return errorMessages[error];
  }
  
  // Otherwise, return the raw error (could be a system error message)
  return error;
}

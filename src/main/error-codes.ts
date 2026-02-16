// Error codes returned by main process services
// These codes are used for localization in the renderer

export const ErrorCode = {
  // Project errors
  PROJECT_EXISTS: 'ERR_PROJECT_EXISTS',
  PROJECT_NOT_FOUND: 'ERR_PROJECT_NOT_FOUND',
  PROJECT_FOLDER_NOT_FOUND: 'ERR_PROJECT_FOLDER_NOT_FOUND',
  IMPORT_FILE_NOT_FOUND: 'ERR_IMPORT_FILE_NOT_FOUND',
  INVALID_OPTION: 'ERR_INVALID_OPTION',
  
  // File errors
  FILE_NOT_FOUND: 'ERR_FILE_NOT_FOUND',
  
  // Unknown error
  UNKNOWN: 'ERR_UNKNOWN'
} as const;

export type ErrorCodeType = typeof ErrorCode[keyof typeof ErrorCode];

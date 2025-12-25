// Unified API Response Interfaces

/**
 * Standard API response structure for all endpoints
 */
export interface ApiResponse<T = unknown> {
    success: boolean;
    message: string;
    data?: T;
    errors?: ApiError[];
    meta?: ApiMeta;
    timestamp: string;
}

/**
 * API Error structure for validation and other errors
 */
export interface ApiError {
    code: string;
    message: string;
    field?: string;
    details?: unknown;
}

/**
 * Metadata for paginated or array responses
 */
export interface ApiMeta {
    total?: number;
    page?: number;
    limit?: number;
    totalPages?: number;
    processingTime?: number;
    [key: string]: unknown;
}

/**
 * Error codes for standardized error handling
 */
export enum ErrorCode {
    // Validation errors (400)
    VALIDATION_ERROR = 'VALIDATION_ERROR',
    INVALID_INPUT = 'INVALID_INPUT',
    MISSING_REQUIRED_FIELD = 'MISSING_REQUIRED_FIELD',
    INVALID_FORMAT = 'INVALID_FORMAT',
    INVALID_FILE_TYPE = 'INVALID_FILE_TYPE',
    FILE_TOO_LARGE = 'FILE_TOO_LARGE',

    // Authentication errors (401)
    UNAUTHORIZED = 'UNAUTHORIZED',
    INVALID_TOKEN = 'INVALID_TOKEN',
    TOKEN_EXPIRED = 'TOKEN_EXPIRED',

    // Authorization errors (403)
    FORBIDDEN = 'FORBIDDEN',
    INSUFFICIENT_PERMISSIONS = 'INSUFFICIENT_PERMISSIONS',

    // Not found errors (404)
    NOT_FOUND = 'NOT_FOUND',
    RESOURCE_NOT_FOUND = 'RESOURCE_NOT_FOUND',

    // Conflict errors (409)
    CONFLICT = 'CONFLICT',
    DUPLICATE_ENTRY = 'DUPLICATE_ENTRY',

    // Server errors (500)
    INTERNAL_ERROR = 'INTERNAL_ERROR',
    DATABASE_ERROR = 'DATABASE_ERROR',
    EXTERNAL_SERVICE_ERROR = 'EXTERNAL_SERVICE_ERROR',
}

/**
 * HTTP Status codes mapping
 */
export enum HttpStatus {
    OK = 200,
    CREATED = 201,
    ACCEPTED = 202,
    NO_CONTENT = 204,
    MULTI_STATUS = 207,
    BAD_REQUEST = 400,
    UNAUTHORIZED = 401,
    FORBIDDEN = 403,
    NOT_FOUND = 404,
    CONFLICT = 409,
    UNPROCESSABLE_ENTITY = 422,
    INTERNAL_SERVER_ERROR = 500,
    BAD_GATEWAY = 502,
    SERVICE_UNAVAILABLE = 503,
}

import { ApiError, ErrorCode, HttpStatus } from '../interfaces/api.interface';

/**
 * Base Application Error class
 * All custom errors should extend this class
 */
export class AppError extends Error {
    public readonly statusCode: HttpStatus;
    public readonly code: ErrorCode;
    public readonly errors: ApiError[];
    public readonly isOperational: boolean;

    constructor(
        message: string,
        statusCode: HttpStatus = HttpStatus.INTERNAL_SERVER_ERROR,
        code: ErrorCode = ErrorCode.INTERNAL_ERROR,
        errors: ApiError[] = [],
        isOperational: boolean = true
    ) {
        super(message);
        this.statusCode = statusCode;
        this.code = code;
        this.errors = errors.length > 0 ? errors : [{ code, message }];
        this.isOperational = isOperational;

        // Maintains proper stack trace for where error was thrown
        Error.captureStackTrace(this, this.constructor);

        // Set the prototype explicitly (needed for extending built-in classes)
        Object.setPrototypeOf(this, AppError.prototype);
    }
}

/**
 * Validation Error - 400 Bad Request
 */
export class ValidationError extends AppError {
    constructor(message: string, errors: ApiError[] = []) {
        super(message, HttpStatus.BAD_REQUEST, ErrorCode.VALIDATION_ERROR, errors);
        Object.setPrototypeOf(this, ValidationError.prototype);
    }

    /**
     * Create validation error for a single field
     */
    static forField(field: string, message: string): ValidationError {
        return new ValidationError('Validation failed', [
            { code: ErrorCode.VALIDATION_ERROR, message, field },
        ]);
    }

    /**
     * Create validation error for multiple fields
     */
    static forFields(fieldErrors: Array<{ field: string; message: string }>): ValidationError {
        return new ValidationError(
            'Validation failed',
            fieldErrors.map((e) => ({
                code: ErrorCode.VALIDATION_ERROR,
                message: e.message,
                field: e.field,
            }))
        );
    }
}

/**
 * Not Found Error - 404
 */
export class NotFoundError extends AppError {
    constructor(resource: string = 'Resource', identifier?: string) {
        const message = identifier
            ? `${resource} with identifier '${identifier}' not found`
            : `${resource} not found`;
        super(message, HttpStatus.NOT_FOUND, ErrorCode.NOT_FOUND);
        Object.setPrototypeOf(this, NotFoundError.prototype);
    }
}

/**
 * Unauthorized Error - 401
 */
export class UnauthorizedError extends AppError {
    constructor(message: string = 'Unauthorized access') {
        super(message, HttpStatus.UNAUTHORIZED, ErrorCode.UNAUTHORIZED);
        Object.setPrototypeOf(this, UnauthorizedError.prototype);
    }
}

/**
 * Forbidden Error - 403
 */
export class ForbiddenError extends AppError {
    constructor(message: string = 'Access forbidden') {
        super(message, HttpStatus.FORBIDDEN, ErrorCode.FORBIDDEN);
        Object.setPrototypeOf(this, ForbiddenError.prototype);
    }
}

/**
 * Conflict Error - 409
 */
export class ConflictError extends AppError {
    constructor(message: string = 'Resource conflict') {
        super(message, HttpStatus.CONFLICT, ErrorCode.CONFLICT);
        Object.setPrototypeOf(this, ConflictError.prototype);
    }
}

/**
 * Database Error - 500
 */
export class DatabaseError extends AppError {
    constructor(message: string = 'Database operation failed', details?: unknown) {
        super(message, HttpStatus.INTERNAL_SERVER_ERROR, ErrorCode.DATABASE_ERROR, [
            { code: ErrorCode.DATABASE_ERROR, message, details },
        ]);
        Object.setPrototypeOf(this, DatabaseError.prototype);
    }
}

/**
 * File Upload Error - 400
 */
export class FileUploadError extends AppError {
    constructor(message: string, code: ErrorCode = ErrorCode.INVALID_FILE_TYPE) {
        super(message, HttpStatus.BAD_REQUEST, code);
        Object.setPrototypeOf(this, FileUploadError.prototype);
    }

    static invalidType(allowedTypes: string[]): FileUploadError {
        return new FileUploadError(
            `Invalid file type. Allowed types: ${allowedTypes.join(', ')}`,
            ErrorCode.INVALID_FILE_TYPE
        );
    }

    static tooLarge(maxSize: string): FileUploadError {
        return new FileUploadError(
            `File size exceeds the ${maxSize} limit`,
            ErrorCode.FILE_TOO_LARGE
        );
    }

    static missing(): FileUploadError {
        return new FileUploadError('No file uploaded', ErrorCode.MISSING_REQUIRED_FIELD);
    }
}

/**
 * External Service Error - 502
 */
export class ExternalServiceError extends AppError {
    constructor(serviceName: string, message: string = 'External service error') {
        super(
            `${serviceName}: ${message}`,
            HttpStatus.BAD_GATEWAY,
            ErrorCode.EXTERNAL_SERVICE_ERROR
        );
        Object.setPrototypeOf(this, ExternalServiceError.prototype);
    }
}

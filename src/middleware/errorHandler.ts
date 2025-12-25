import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors';
import { ApiResponse, ErrorCode, HttpStatus } from '../interfaces/api.interface';

/**
 * Global Error Handler Middleware
 * Handles all errors thrown in the application and returns standardized responses
 */
export const errorHandler = (
    err: Error,
    req: Request,
    res: Response,
    _next: NextFunction
): void => {
    // Log error for debugging (in production, use a proper logger)
    console.error('❌ Error:', {
        name: err.name,
        message: err.message,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
        path: req.path,
        method: req.method,
        timestamp: new Date().toISOString(),
    });

    // Handle AppError (our custom errors)
    if (err instanceof AppError) {
        const response: ApiResponse = {
            success: false,
            message: err.message,
            errors: err.errors,
            timestamp: new Date().toISOString(),
        };
        res.status(err.statusCode).json(response);
        return;
    }

    // Handle Multer errors
    if (err.name === 'MulterError') {
        const response: ApiResponse = {
            success: false,
            message: getMulterErrorMessage(err),
            errors: [{ code: ErrorCode.INVALID_INPUT, message: err.message }],
            timestamp: new Date().toISOString(),
        };
        res.status(HttpStatus.BAD_REQUEST).json(response);
        return;
    }

    // Handle Sequelize validation errors
    if (err.name === 'SequelizeValidationError' || err.name === 'SequelizeUniqueConstraintError') {
        const sequelizeError = err as any;
        const errors = sequelizeError.errors?.map((e: any) => ({
            code: ErrorCode.VALIDATION_ERROR,
            message: e.message,
            field: e.path,
        })) || [{ code: ErrorCode.VALIDATION_ERROR, message: err.message }];

        const response: ApiResponse = {
            success: false,
            message: 'Validation error',
            errors,
            timestamp: new Date().toISOString(),
        };
        res.status(HttpStatus.BAD_REQUEST).json(response);
        return;
    }

    // Handle Sequelize database errors
    if (err.name?.startsWith('Sequelize')) {
        const response: ApiResponse = {
            success: false,
            message: 'Database operation failed',
            errors: [{ code: ErrorCode.DATABASE_ERROR, message: 'A database error occurred' }],
            timestamp: new Date().toISOString(),
        };
        res.status(HttpStatus.INTERNAL_SERVER_ERROR).json(response);
        return;
    }

    // Handle JSON parsing errors
    if (err instanceof SyntaxError && 'body' in err) {
        const response: ApiResponse = {
            success: false,
            message: 'Invalid JSON in request body',
            errors: [{ code: ErrorCode.INVALID_FORMAT, message: 'Request body contains invalid JSON' }],
            timestamp: new Date().toISOString(),
        };
        res.status(HttpStatus.BAD_REQUEST).json(response);
        return;
    }

    // Handle unknown errors (don't leak error details in production)
    const isDevelopment = process.env.NODE_ENV === 'development';
    const response: ApiResponse = {
        success: false,
        message: isDevelopment ? err.message : 'Internal server error',
        errors: [
            {
                code: ErrorCode.INTERNAL_ERROR,
                message: isDevelopment ? err.message : 'An unexpected error occurred',
                details: isDevelopment ? err.stack : undefined,
            },
        ],
        timestamp: new Date().toISOString(),
    };
    res.status(HttpStatus.INTERNAL_SERVER_ERROR).json(response);
};

/**
 * Get user-friendly message for Multer errors
 */
const getMulterErrorMessage = (err: Error): string => {
    const multerError = err as any;
    switch (multerError.code) {
        case 'LIMIT_FILE_SIZE':
            return 'File size exceeds the maximum allowed limit';
        case 'LIMIT_FILE_COUNT':
            return 'Too many files uploaded';
        case 'LIMIT_UNEXPECTED_FILE':
            return 'Unexpected file field';
        case 'LIMIT_PART_COUNT':
            return 'Too many parts in multipart request';
        case 'LIMIT_FIELD_KEY':
            return 'Field name too long';
        case 'LIMIT_FIELD_VALUE':
            return 'Field value too long';
        case 'LIMIT_FIELD_COUNT':
            return 'Too many fields';
        default:
            return err.message || 'File upload error';
    }
};

/**
 * 404 Not Found Handler
 * Handles requests to undefined routes
 */
export const notFoundHandler = (req: Request, res: Response): void => {
    const response: ApiResponse = {
        success: false,
        message: `Route ${req.method} ${req.path} not found`,
        errors: [{ code: ErrorCode.NOT_FOUND, message: 'The requested endpoint does not exist' }],
        timestamp: new Date().toISOString(),
    };
    res.status(HttpStatus.NOT_FOUND).json(response);
};

/**
 * Async Handler Wrapper
 * Wraps async route handlers to automatically catch errors and pass them to error handler
 */
export const asyncHandler = (
    fn: (req: Request, res: Response, next: NextFunction) => Promise<void>
) => {
    return (req: Request, res: Response, next: NextFunction): void => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};

import { Response } from 'express';
import { ApiResponse, ApiError, ApiMeta, ErrorCode, HttpStatus } from '../interfaces/api.interface';

/**
 * Unified API Response Utility
 * Provides standardized response format for all API endpoints
 */
class ApiResponseBuilder<T = unknown> {
    private response: ApiResponse<T>;

    constructor() {
        this.response = {
            success: true,
            message: '',
            timestamp: new Date().toISOString(),
        };
    }

    /**
     * Set success status
     */
    setSuccess(success: boolean): this {
        this.response.success = success;
        return this;
    }

    /**
     * Set response message
     */
    setMessage(message: string): this {
        this.response.message = message;
        return this;
    }

    /**
     * Set response data (single item or array)
     */
    setData(data: T): this {
        this.response.data = data;
        return this;
    }

    /**
     * Set errors array
     */
    setErrors(errors: ApiError[]): this {
        this.response.errors = errors;
        return this;
    }

    /**
     * Add a single error
     */
    addError(error: ApiError): this {
        if (!this.response.errors) {
            this.response.errors = [];
        }
        this.response.errors.push(error);
        return this;
    }

    /**
     * Set metadata (for pagination, processing stats, etc.)
     */
    setMeta(meta: ApiMeta): this {
        this.response.meta = meta;
        return this;
    }

    /**
     * Build and return the response object
     */
    build(): ApiResponse<T> {
        return this.response;
    }

    /**
     * Send response directly to Express Response object
     */
    send(res: Response, statusCode: HttpStatus = HttpStatus.OK): void {
        res.status(statusCode).json(this.response);
    }
}

/**
 * API Response utility functions
 */
export const apiResponse = {
    /**
     * Create a new response builder
     */
    builder: <T = unknown>(): ApiResponseBuilder<T> => new ApiResponseBuilder<T>(),

    /**
     * Success response with single data item
     */
    success: <T>(res: Response, data: T, message: string = 'Success', statusCode: HttpStatus = HttpStatus.OK): void => {
        const response: ApiResponse<T> = {
            success: true,
            message,
            data,
            timestamp: new Date().toISOString(),
        };
        res.status(statusCode).json(response);
    },

    /**
     * Success response with array data and optional pagination
     */
    successArray: <T>(
        res: Response,
        data: T[],
        message: string = 'Success',
        meta?: ApiMeta,
        statusCode: HttpStatus = HttpStatus.OK
    ): void => {
        const response: ApiResponse<T[]> = {
            success: true,
            message,
            data,
            meta: meta ?? { total: data.length },
            timestamp: new Date().toISOString(),
        };
        res.status(statusCode).json(response);
    },

    /**
     * Success response for created resources
     */
    created: <T>(res: Response, data: T, message: string = 'Resource created successfully'): void => {
        apiResponse.success(res, data, message, HttpStatus.CREATED);
    },

    /**
     * Success response with no content
     */
    noContent: (res: Response): void => {
        res.status(HttpStatus.NO_CONTENT).send();
    },

    /**
     * Error response with validation errors
     */
    validationError: (res: Response, errors: ApiError[], message: string = 'Validation failed'): void => {
        const response: ApiResponse = {
            success: false,
            message,
            errors,
            timestamp: new Date().toISOString(),
        };
        res.status(HttpStatus.BAD_REQUEST).json(response);
    },

    /**
     * Single field validation error
     */
    fieldError: (res: Response, field: string, message: string, code: ErrorCode = ErrorCode.VALIDATION_ERROR): void => {
        apiResponse.validationError(res, [{ code, message, field }]);
    },

    /**
     * Bad request error
     */
    badRequest: (res: Response, message: string, errors?: ApiError[]): void => {
        const response: ApiResponse = {
            success: false,
            message,
            ...(errors ? { errors } : {}),
            timestamp: new Date().toISOString(),
        };
        res.status(HttpStatus.BAD_REQUEST).json(response);
    },

    /**
     * Unauthorized error
     */
    unauthorized: (res: Response, message: string = 'Unauthorized'): void => {
        const response: ApiResponse = {
            success: false,
            message,
            errors: [{ code: ErrorCode.UNAUTHORIZED, message }],
            timestamp: new Date().toISOString(),
        };
        res.status(HttpStatus.UNAUTHORIZED).json(response);
    },

    /**
     * Forbidden error
     */
    forbidden: (res: Response, message: string = 'Access forbidden'): void => {
        const response: ApiResponse = {
            success: false,
            message,
            errors: [{ code: ErrorCode.FORBIDDEN, message }],
            timestamp: new Date().toISOString(),
        };
        res.status(HttpStatus.FORBIDDEN).json(response);
    },

    /**
     * Not found error
     */
    notFound: (res: Response, message: string = 'Resource not found'): void => {
        const response: ApiResponse = {
            success: false,
            message,
            errors: [{ code: ErrorCode.NOT_FOUND, message }],
            timestamp: new Date().toISOString(),
        };
        res.status(HttpStatus.NOT_FOUND).json(response);
    },

    /**
     * Conflict error (e.g., duplicate entry)
     */
    conflict: (res: Response, message: string = 'Resource conflict'): void => {
        const response: ApiResponse = {
            success: false,
            message,
            errors: [{ code: ErrorCode.CONFLICT, message }],
            timestamp: new Date().toISOString(),
        };
        res.status(HttpStatus.CONFLICT).json(response);
    },

    /**
     * Internal server error
     */
    internalError: (res: Response, message: string = 'Internal server error', details?: unknown): void => {
        const response: ApiResponse = {
            success: false,
            message,
            errors: [{ code: ErrorCode.INTERNAL_ERROR, message, details }],
            timestamp: new Date().toISOString(),
        };
        res.status(HttpStatus.INTERNAL_SERVER_ERROR).json(response);
    },

    /**
     * Multi-status response (partial success)
     */
    multiStatus: <T>(res: Response, data: T, message: string, errors?: ApiError[], meta?: ApiMeta): void => {
        const response: ApiResponse<T> = {
            success: true,
            message,
            data,
            ...(errors ? { errors } : {}),
            ...(meta ? { meta } : {}),
            timestamp: new Date().toISOString(),
        };
        res.status(HttpStatus.MULTI_STATUS).json(response);
    },
};

/**
 * Create an API error object
 */
export const createApiError = (
    code: ErrorCode,
    message: string,
    field?: string,
    details?: unknown
): ApiError => ({
    code,
    message,
    ...(field ? { field } : {}),
    ...(details !== undefined ? { details } : {}),
});

export { ApiResponseBuilder };

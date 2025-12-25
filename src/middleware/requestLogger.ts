import { Request, Response, NextFunction } from 'express';

/**
 * Request Logger Middleware
 * Logs all incoming requests with timing information
 */

interface RequestLogData {
    method: string;
    path: string;
    query: Record<string, unknown>;
    ip: string | undefined;
    userAgent: string | undefined;
    contentType: string | undefined;
    contentLength: string | undefined;
    timestamp: string;
}

interface ResponseLogData extends RequestLogData {
    statusCode: number;
    responseTime: string;
}

/**
 * Format bytes to human readable string
 */
const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

/**
 * Get color code for status
 */
const getStatusColor = (status: number): string => {
    if (status >= 500) return '\x1b[31m'; // Red
    if (status >= 400) return '\x1b[33m'; // Yellow
    if (status >= 300) return '\x1b[36m'; // Cyan
    if (status >= 200) return '\x1b[32m'; // Green
    return '\x1b[0m'; // Default
};

/**
 * Get color code for method
 */
const getMethodColor = (method: string): string => {
    const colors: Record<string, string> = {
        GET: '\x1b[32m',    // Green
        POST: '\x1b[34m',   // Blue
        PUT: '\x1b[33m',    // Yellow
        PATCH: '\x1b[33m',  // Yellow
        DELETE: '\x1b[31m', // Red
        OPTIONS: '\x1b[36m', // Cyan
        HEAD: '\x1b[35m',   // Magenta
    };
    return colors[method] || '\x1b[0m';
};

const RESET = '\x1b[0m';

/**
 * Request Logger Middleware
 */
export const requestLogger = (req: Request, res: Response, next: NextFunction): void => {
    const startTime = process.hrtime.bigint();
    const timestamp = new Date().toISOString();

    // Capture request data
    const requestData: RequestLogData = {
        method: req.method,
        path: req.originalUrl || req.path,
        query: req.query as Record<string, unknown>,
        ip: req.ip || req.socket.remoteAddress,
        userAgent: req.get('user-agent'),
        contentType: req.get('content-type'),
        contentLength: req.get('content-length'),
        timestamp,
    };

    // Log incoming request
    const methodColor = getMethodColor(req.method);
    console.log(
        `${methodColor}→ ${req.method}${RESET} ${req.originalUrl || req.path} ` +
        `[${timestamp}] ` +
        `IP: ${requestData.ip || 'unknown'}`
    );

    // Capture response data when finished
    res.on('finish', () => {
        const endTime = process.hrtime.bigint();
        const responseTimeNs = Number(endTime - startTime);
        const responseTimeMs = (responseTimeNs / 1_000_000).toFixed(2);

        const statusColor = getStatusColor(res.statusCode);
        const responseSize = res.get('content-length');

        // Log response
        console.log(
            `${statusColor}← ${res.statusCode}${RESET} ${req.method} ${req.originalUrl || req.path} ` +
            `${responseTimeMs}ms ` +
            `${responseSize ? formatBytes(parseInt(responseSize, 10)) : '-'}`
        );

        // Log detailed info in development
        if (process.env.NODE_ENV === 'development' && res.statusCode >= 400) {
            const responseData: ResponseLogData = {
                ...requestData,
                statusCode: res.statusCode,
                responseTime: `${responseTimeMs}ms`,
            };
            console.log('  Details:', JSON.stringify(responseData, null, 2));
        }
    });

    next();
};

/**
 * Simple request logger (minimal output)
 */
export const simpleRequestLogger = (req: Request, res: Response, next: NextFunction): void => {
    const startTime = Date.now();

    res.on('finish', () => {
        const duration = Date.now() - startTime;
        console.log(`${req.method} ${req.originalUrl || req.path} ${res.statusCode} - ${duration}ms`);
    });

    next();
};

/**
 * JSON request logger (for production/log aggregation)
 */
export const jsonRequestLogger = (req: Request, res: Response, next: NextFunction): void => {
    const startTime = process.hrtime.bigint();
    const requestId = req.get('x-request-id') || generateRequestId();

    // Attach request ID to request object for tracking
    (req as any).requestId = requestId;
    res.setHeader('x-request-id', requestId);

    res.on('finish', () => {
        const endTime = process.hrtime.bigint();
        const responseTimeMs = Number(endTime - startTime) / 1_000_000;

        const logEntry = {
            requestId,
            timestamp: new Date().toISOString(),
            method: req.method,
            path: req.originalUrl || req.path,
            statusCode: res.statusCode,
            responseTime: responseTimeMs,
            ip: req.ip || req.socket.remoteAddress,
            userAgent: req.get('user-agent'),
            contentLength: res.get('content-length'),
        };

        console.log(JSON.stringify(logEntry));
    });

    next();
};

/**
 * Generate a simple request ID
 */
const generateRequestId = (): string => {
    return `${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 9)}`;
};

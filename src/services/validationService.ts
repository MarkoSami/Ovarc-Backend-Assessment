import {
    ValidationResult,
    FileValidationInput,
    BatchSizeValidationInput,
    UUIDValidationInput,
} from '../interfaces';

// Default values
const DEFAULT_ALLOWED_MIME_TYPES = ['text/csv', 'application/vnd.ms-excel', 'text/plain'];
const DEFAULT_ALLOWED_EXTENSIONS = ['.csv'];
const DEFAULT_MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const DEFAULT_BATCH_SIZE = 100;
const DEFAULT_MIN_BATCH_SIZE = 1;
const DEFAULT_MAX_BATCH_SIZE = 1000;

// UUID regex pattern
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Validate uploaded file
 */
export const validateFile = (input: FileValidationInput): ValidationResult => {
    const {
        file,
        allowedMimeTypes = DEFAULT_ALLOWED_MIME_TYPES,
        allowedExtensions = DEFAULT_ALLOWED_EXTENSIONS,
        maxSize = DEFAULT_MAX_FILE_SIZE,
    } = input;

    // Check if file exists
    if (!file) {
        return {
            isValid: false,
            error: 'No file uploaded. Please upload a CSV file.',
        };
    }

    // Check file size
    if (file.size === 0) {
        return {
            isValid: false,
            error: 'Uploaded file is empty.',
        };
    }

    if (file.size > maxSize) {
        return {
            isValid: false,
            error: `File size exceeds the maximum allowed size of ${maxSize / (1024 * 1024)}MB.`,
        };
    }

    // Validate MIME type
    if (!allowedMimeTypes.includes(file.mimetype)) {
        return {
            isValid: false,
            error: 'Invalid file type. Please upload a CSV file.',
        };
    }

    // Validate file extension
    const fileName = file.originalname.toLowerCase();
    const hasValidExtension = allowedExtensions.some((ext) => fileName.endsWith(ext));
    if (!hasValidExtension) {
        return {
            isValid: false,
            error: `Invalid file extension. Allowed extensions: ${allowedExtensions.join(', ')}`,
        };
    }

    return { isValid: true };
};

/**
 * Validate and parse batch size
 */
export const validateBatchSize = (
    input: BatchSizeValidationInput
): ValidationResult & { value: number } => {
    const {
        batchSize,
        min = DEFAULT_MIN_BATCH_SIZE,
        max = DEFAULT_MAX_BATCH_SIZE,
        defaultValue = DEFAULT_BATCH_SIZE,
    } = input;

    // If not provided, use default
    if (!batchSize) {
        return { isValid: true, value: defaultValue };
    }

    const parsed = parseInt(batchSize, 10);

    if (isNaN(parsed)) {
        return {
            isValid: false,
            error: 'Batch size must be a valid number.',
            value: defaultValue,
        };
    }

    if (parsed < min || parsed > max) {
        return {
            isValid: false,
            error: `Batch size must be between ${min} and ${max}.`,
            value: defaultValue,
        };
    }

    return { isValid: true, value: parsed };
};

/**
 * Validate UUID format
 */
export const validateUUID = (input: UUIDValidationInput): ValidationResult => {
    const { id, fieldName = 'ID' } = input;

    if (!id || typeof id !== 'string') {
        return {
            isValid: false,
            error: `${fieldName} is required.`,
        };
    }

    if (!UUID_REGEX.test(id)) {
        return {
            isValid: false,
            error: `Invalid ${fieldName} format. Must be a valid UUID.`,
        };
    }

    return { isValid: true };
};

/**
 * Validate required string field
 */
export const validateRequiredString = (
    value: string | undefined | null,
    fieldName: string
): ValidationResult => {
    if (!value || typeof value !== 'string' || !value.trim()) {
        return {
            isValid: false,
            error: `${fieldName} is required.`,
        };
    }

    return { isValid: true };
};

/**
 * Validate positive integer
 */
export const validatePositiveInteger = (
    value: string | number | undefined,
    fieldName: string
): ValidationResult & { value: number } => {
    if (value === undefined || value === null || value === '') {
        return {
            isValid: false,
            error: `${fieldName} is required.`,
            value: 0,
        };
    }

    const parsed = typeof value === 'number' ? value : parseInt(value, 10);

    if (isNaN(parsed) || parsed < 1) {
        return {
            isValid: false,
            error: `${fieldName} must be a positive integer.`,
            value: 0,
        };
    }

    return { isValid: true, value: parsed };
};

/**
 * Validate non-negative number (for prices, etc.)
 */
export const validateNonNegativeNumber = (
    value: string | number | undefined,
    fieldName: string
): ValidationResult & { value: number } => {
    if (value === undefined || value === null || value === '') {
        return {
            isValid: false,
            error: `${fieldName} is required.`,
            value: 0,
        };
    }

    const parsed = typeof value === 'number' ? value : parseFloat(value);

    if (isNaN(parsed) || parsed < 0) {
        return {
            isValid: false,
            error: `${fieldName} must be a non-negative number.`,
            value: 0,
        };
    }

    return { isValid: true, value: parsed };
};

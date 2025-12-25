// Validation-related interfaces

export interface ValidationResult {
    isValid: boolean;
    error?: string;
}

export interface FileValidationInput {
    file?: Express.Multer.File;
    allowedMimeTypes?: string[];
    allowedExtensions?: string[];
    maxSize?: number;
}

export interface BatchSizeValidationInput {
    batchSize: string | undefined;
    min?: number;
    max?: number;
    defaultValue?: number;
}

export interface UUIDValidationInput {
    id: string | undefined;
    fieldName?: string;
}

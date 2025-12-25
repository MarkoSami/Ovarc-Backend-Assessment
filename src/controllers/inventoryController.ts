import { Request, Response } from 'express';
import { validateFileUpload, processCSV, buildUploadResponse } from '../services/inventoryService';
import { ValidationError } from '../utils/errors';

export const uploadInventory = async (req: Request, res: Response): Promise<void> => {
    // Validate file upload
    const fileValidation = validateFileUpload(req.file);
    if (!fileValidation.isValid) {
        throw ValidationError.forField('file', fileValidation.error || 'Invalid file');
    }

    // Process CSV and build response
    const result = await processCSV(req.file!.buffer);
    const response = buildUploadResponse(result);

    // Send response
    res.status(response.statusCode).json({
        success: response.success,
        message: response.message,
        data: response.data,
        meta: response.meta,
        timestamp: new Date().toISOString(),
    });
};

import { Request, Response } from 'express';
import {
    validateStoreId,
    validateStoreExists,
    getStoreReportData,
    generatePDFReport,
    generateReportFilename,
} from '../services/reportService';
import * as storeService from '../services/storeService';
import { ValidationError, NotFoundError } from '../utils/errors';

/**
 * Get all stores
 */
export const getAllStores = async (req: Request, res: Response): Promise<void> => {
    const stores = await storeService.getAllStores();

    res.status(200).json({
        success: true,
        message: 'Stores retrieved successfully',
        data: stores,
        meta: { total: stores.length },
        timestamp: new Date().toISOString(),
    });
};

export const downloadStoreReport = async (req: Request, res: Response): Promise<void> => {
    const id = req.params.id as string;

    // Validate store ID format
    const idValidation = validateStoreId(id);
    if (!idValidation.isValid) {
        throw ValidationError.forField('id', idValidation.error || 'Invalid store ID');
    }

    // Validate store exists
    const storeValidation = await validateStoreExists(id);
    if (!storeValidation.isValid) {
        throw new NotFoundError('Store', id);
    }

    // Get report data
    const reportData = await getStoreReportData(id);
    if (!reportData) {
        throw new Error('Failed to generate report data');
    }

    // Generate PDF and filename
    const pdfBuffer = await generatePDFReport(reportData);
    const filename = generateReportFilename(reportData.store.name);

    // Send PDF response
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    res.send(pdfBuffer);
};

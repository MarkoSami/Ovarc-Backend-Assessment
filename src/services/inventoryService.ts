import { createReadStream, createWriteStream, promises as fs } from 'fs';
import { Readable } from 'stream';
import { pipeline } from 'stream/promises';
import csvParser from 'csv-parser';
import path from 'path';
import os from 'os';
import { sequelize } from '../db';
import * as authorService from './authorService';
import * as bookService from './bookService';
import * as storeService from './storeService';
import * as validationService from './validationService';
import { CSVRow, ProcessingResult, ProcessRowResult, BatchProcessingOptions, ValidationResult } from '../interfaces';

const DEFAULT_BATCH_SIZE = 100;
const DEFAULT_TEMP_DIR = os.tmpdir();

// ==================== VALIDATION FUNCTIONS ====================

/**
 * Validate file upload for CSV processing
 */
export const validateFileUpload = (file?: Express.Multer.File): ValidationResult => {
    return validationService.validateFile({
        file: file,
        allowedMimeTypes: ['text/csv', 'application/vnd.ms-excel', 'text/plain'],
        allowedExtensions: ['.csv'],
    } as any);
};

/**
 * Get system batch size (internal use only)
 */
const getSystemBatchSize = (): number => {
    return DEFAULT_BATCH_SIZE;
};

/**
 * Validate a single CSV row
 */
const validateCSVRow = (row: CSVRow): ValidationResult => {
    // Validate store_name
    const storeNameValidation = validationService.validateRequiredString(row.store_name, 'store_name');
    if (!storeNameValidation.isValid) return storeNameValidation;

    // Validate store_address
    const storeAddressValidation = validationService.validateRequiredString(row.store_address, 'store_address');
    if (!storeAddressValidation.isValid) return storeAddressValidation;

    // Validate book_name
    const bookNameValidation = validationService.validateRequiredString(row.book_name, 'book_name');
    if (!bookNameValidation.isValid) return bookNameValidation;

    // Validate pages
    const pagesValidation = validationService.validatePositiveInteger(row.pages, 'pages');
    if (!pagesValidation.isValid) return pagesValidation;

    // Validate author_name
    const authorNameValidation = validationService.validateRequiredString(row.author_name, 'author_name');
    if (!authorNameValidation.isValid) return authorNameValidation;

    // Validate price
    const priceValidation = validationService.validateNonNegativeNumber(row.price, 'price');
    if (!priceValidation.isValid) return priceValidation;

    return { isValid: true };
};

// ==================== FILE OPERATIONS ====================

// ==================== FILE OPERATIONS ====================

/**
 * Save uploaded file buffer to a temporary file on disk
 */
const saveTempFile = async (fileBuffer: Buffer, tempDir: string): Promise<string> => {
    const tempFileName = `csv-upload-${Date.now()}-${Math.random().toString(36).substring(7)}.csv`;
    const tempFilePath = path.join(tempDir, tempFileName);
    await fs.writeFile(tempFilePath, fileBuffer);
    return tempFilePath;
};

/**
 * Clean up temporary file
 */
const cleanupTempFile = async (filePath: string): Promise<void> => {
    try {
        await fs.unlink(filePath);
    } catch (error) {
        console.warn(`Failed to cleanup temp file ${filePath}:`, error);
    }
};

/**
 * Count total rows in CSV file (excluding header)
 */
const countCSVRows = async (filePath: string): Promise<number> => {
    return new Promise((resolve, reject) => {
        let count = 0;
        createReadStream(filePath)
            .pipe(csvParser({
                mapHeaders: ({ header }) => header.trim().toLowerCase().replace(/\s+/g, '_'),
            }))
            .on('data', () => {
                count++;
            })
            .on('end', () => resolve(count))
            .on('error', reject);
    });
};

/**
 * Read a batch of rows from CSV file
 */
const readBatch = async (
    filePath: string,
    startRow: number,
    batchSize: number
): Promise<CSVRow[]> => {
    return new Promise((resolve, reject) => {
        const rows: CSVRow[] = [];
        let currentRow = 0;

        const stream = createReadStream(filePath)
            .pipe(csvParser({
                mapHeaders: ({ header }) => header.trim().toLowerCase().replace(/\s+/g, '_'),
            }));

        stream.on('data', (row: CSVRow) => {
            if (currentRow >= startRow && currentRow < startRow + batchSize) {
                rows.push(row);
            }
            currentRow++;

            // Stop reading if we have enough rows
            if (currentRow >= startRow + batchSize) {
                stream.destroy();
                resolve(rows);
            }
        });

        stream.on('end', () => resolve(rows));
        stream.on('error', reject);
    });
};

/**
 * Process a batch of rows
 */
const processBatch = async (
    rows: CSVRow[],
    startRowNumber: number,
    result: ProcessingResult
): Promise<void> => {
    for (let i = 0; i < rows.length; i++) {
        const row = rows[i]!;
        const rowNumber = startRowNumber + i;

        const transaction = await sequelize.transaction();

        try {
            // Validate required fields using validation function
            const validation = validateCSVRow(row);
            if (!validation.isValid) {
                result.errors.push({ row: rowNumber, message: validation.error || 'Validation failed' });
                await transaction.rollback();
                continue;
            }

            // Process the row
            const { createdStore, createdAuthor, createdBook, createdStoreBook, updatedStoreBook } =
                await processRow(row, transaction);

            await transaction.commit();

            result.processedRows++;
            if (createdStore) result.created.stores++;
            if (createdAuthor) result.created.authors++;
            if (createdBook) result.created.books++;
            if (createdStoreBook) result.created.storeBooks++;
            if (updatedStoreBook) result.updated.storeBooks++;

        } catch (error) {
            await transaction.rollback();
            const message = error instanceof Error ? error.message : 'Unknown error';
            result.errors.push({ row: rowNumber, message });
        }
    }
};

/**
 * Process CSV file in batches with temporary disk storage
 * This is more memory-efficient for large files
 */
export const processCSV = async (
    fileBuffer: Buffer
): Promise<ProcessingResult> => {
    const batchSize = getSystemBatchSize();
    const tempDir = DEFAULT_TEMP_DIR;

    const result: ProcessingResult = {
        success: true,
        totalRows: 0,
        processedRows: 0,
        errors: [],
        created: {
            stores: 0,
            authors: 0,
            books: 0,
            storeBooks: 0,
        },
        updated: {
            storeBooks: 0,
        },
    };

    let tempFilePath: string | null = null;

    try {
        // Save buffer to temporary file
        tempFilePath = await saveTempFile(fileBuffer, tempDir);
        console.log(`📁 Saved CSV to temp file: ${tempFilePath}`);

        // Count total rows
        result.totalRows = await countCSVRows(tempFilePath);
        console.log(`📊 Total rows to process: ${result.totalRows}`);

        if (result.totalRows === 0) {
            return result;
        }

        // Calculate number of batches
        const totalBatches = Math.ceil(result.totalRows / batchSize);
        console.log(`📦 Processing in ${totalBatches} batches of ${batchSize} rows each`);

        // Process in batches
        for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
            const startRow = batchIndex * batchSize;
            const startRowNumber = startRow + 2; // +2 because row 1 is header, and we want 1-based indexing

            console.log(`⏳ Processing batch ${batchIndex + 1}/${totalBatches} (rows ${startRowNumber}-${Math.min(startRowNumber + batchSize - 1, result.totalRows + 1)})`);

            // Read batch from disk
            const batchRows = await readBatch(tempFilePath, startRow, batchSize);

            // Process batch
            await processBatch(batchRows, startRowNumber, result);

            console.log(`✅ Batch ${batchIndex + 1}/${totalBatches} completed. Processed: ${result.processedRows}/${result.totalRows}`);
        }

        result.success = result.errors.length === 0;

    } finally {
        // Cleanup temp file
        if (tempFilePath) {
            await cleanupTempFile(tempFilePath);
            console.log(`🗑️ Cleaned up temp file: ${tempFilePath}`);
        }
    }

    return result;
};

/**
 * Process CSV file directly from disk path (for already saved files)
 * Useful when file is already on disk (e.g., from disk storage multer)
 */
export const processCSVFromFile = async (
    filePath: string
): Promise<ProcessingResult> => {
    const batchSize = getSystemBatchSize();

    const result: ProcessingResult = {
        success: true,
        totalRows: 0,
        processedRows: 0,
        errors: [],
        created: {
            stores: 0,
            authors: 0,
            books: 0,
            storeBooks: 0,
        },
        updated: {
            storeBooks: 0,
        },
    };

    // Count total rows
    result.totalRows = await countCSVRows(filePath);
    console.log(`📊 Total rows to process: ${result.totalRows}`);

    if (result.totalRows === 0) {
        return result;
    }

    // Calculate number of batches
    const totalBatches = Math.ceil(result.totalRows / batchSize);
    console.log(`📦 Processing in ${totalBatches} batches of ${batchSize} rows each`);

    // Process in batches
    for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
        const startRow = batchIndex * batchSize;
        const startRowNumber = startRow + 2;

        console.log(`⏳ Processing batch ${batchIndex + 1}/${totalBatches}`);

        // Read batch from disk
        const batchRows = await readBatch(filePath, startRow, batchSize);

        // Process batch
        await processBatch(batchRows, startRowNumber, result);

        console.log(`✅ Batch ${batchIndex + 1}/${totalBatches} completed`);
    }

    result.success = result.errors.length === 0;

    return result;
};

// ==================== BUSINESS LOGIC ====================

const processRow = async (
    row: CSVRow,
    transaction: any
): Promise<ProcessRowResult> => {
    const result: ProcessRowResult = {
        createdStore: false,
        createdAuthor: false,
        createdBook: false,
        createdStoreBook: false,
        updatedStoreBook: false,
    };

    // Find or create store using storeService
    const logoValue = row.logo?.trim();
    const { store, created: storeCreated } = await storeService.findOrCreateStore(
        {
            name: row.store_name.trim(),
            address: row.store_address.trim(),
            ...(logoValue ? { logo: logoValue } : {}),
        },
        transaction
    );
    result.createdStore = storeCreated;

    // Update store logo if provided and store exists
    if (!storeCreated && row.logo?.trim()) {
        await storeService.updateStore(store.id, { logo: row.logo.trim() }, transaction);
    }

    // Find or create author using authorService
    const { author, created: authorCreated } = await authorService.findOrCreateAuthor(
        row.author_name.trim(),
        transaction
    );
    result.createdAuthor = authorCreated;

    // Find or create book using bookService
    const { book, created: bookCreated } = await bookService.findOrCreateBook(
        {
            name: row.book_name.trim(),
            pages: parseInt(row.pages, 10),
            authorId: author.id,
        },
        transaction
    );
    result.createdBook = bookCreated;

    // Find or create store-book relationship using storeService
    const price = parseFloat(row.price);
    const { created: storeBookCreated, updated: storeBookUpdated } = await storeService.findOrCreateStoreBook(
        {
            storeId: store.id,
            bookId: book.id,
            price: price,
        },
        transaction
    );
    result.createdStoreBook = storeBookCreated;
    result.updatedStoreBook = storeBookUpdated;

    return result;
};

// ==================== RESPONSE HELPERS ====================

export interface UploadResponse {
    statusCode: number;
    success: boolean;
    message: string;
    data: ProcessingResult;
    meta: {
        totalRows: number;
        processedRows: number;
        created: ProcessingResult['created'];
        updated: ProcessingResult['updated'];
    };
}

/**
 * Build the upload response based on processing results
 */
export const buildUploadResponse = (result: ProcessingResult): UploadResponse => {
    const meta = {
        totalRows: result.totalRows,
        processedRows: result.processedRows,
        created: result.created,
        updated: result.updated,
    };

    if (result.processedRows === 0 && result.errors.length > 0) {
        return {
            statusCode: 400,
            success: false,
            message: 'Failed to process any rows from the CSV file.',
            data: result,
            meta,
        };
    }

    if (result.errors.length > 0) {
        return {
            statusCode: 207,
            success: true,
            message: 'CSV processed with some errors.',
            data: result,
            meta,
        };
    }

    return {
        statusCode: 200,
        success: true,
        message: 'CSV file processed successfully.',
        data: result,
        meta,
    };
};

// Inventory-related interfaces

export interface CSVRow {
    store_name: string;
    store_address: string;
    book_name: string;
    pages: string;
    author_name: string;
    price: string;
    logo: string;
}

export interface ProcessingResult {
    success: boolean;
    totalRows: number;
    processedRows: number;
    errors: Array<{ row: number; message: string }>;
    created: {
        stores: number;
        authors: number;
        books: number;
        storeBooks: number;
    };
    updated: {
        storeBooks: number;
    };
}

export interface ProcessRowResult {
    createdStore: boolean;
    createdAuthor: boolean;
    createdBook: boolean;
    createdStoreBook: boolean;
    updatedStoreBook: boolean;
}

export interface BatchProcessingOptions {
    batchSize: number;
    tempDir?: string;
}

export interface BatchProgress {
    currentBatch: number;
    totalBatches: number;
    processedRows: number;
    totalRows: number;
}

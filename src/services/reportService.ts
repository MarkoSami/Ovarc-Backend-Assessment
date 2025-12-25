import PDFDocument from 'pdfkit';
import * as storeService from './storeService';
import * as validationService from './validationService';
import { Store } from '../models';
import { StoreReportData, ValidationResult } from '../interfaces';

// ==================== VALIDATION FUNCTIONS ====================

/**
 * Validate store ID parameter
 */
export const validateStoreId = (id: string | undefined): ValidationResult => {
    return validationService.validateUUID({ id, fieldName: 'Store ID' });
};

/**
 * Validate store exists
 */
export const validateStoreExists = async (
    storeId: string
): Promise<{ isValid: boolean; error?: string; store?: Store }> => {
    const store = await storeService.findStoreById(storeId);
    if (!store) {
        return {
            isValid: false,
            error: 'Store not found.',
        };
    }
    return { isValid: true, store };
};

// ==================== DATA RETRIEVAL ====================

export const getStoreById = async (storeId: string): Promise<Store | null> => {
    return storeService.findStoreById(storeId);
};

export const getStoreReportData = async (storeId: string): Promise<StoreReportData | null> => {
    // Get store using storeService
    const store = await storeService.findStoreById(storeId);
    if (!store) {
        return null;
    }

    // Run independent queries in parallel for better performance
    const [topPriciestBooks, topProlificAuthors] = await Promise.all([
        storeService.getTopPriciestBooks(storeId, 5),
        storeService.getTopProlificAuthors(storeId, 5),
    ]);

    const storeData: StoreReportData['store'] = {
        id: store.id,
        name: store.name,
        address: store.address,
    };

    if (store.logo) {
        storeData.logo = store.logo;
    }

    return {
        store: storeData,
        topPriciestBooks: topPriciestBooks.map((sb: any) => ({
            name: sb.book.name,
            authorName: sb.book.author?.name || 'Unknown',
            price: parseFloat(sb.price),
            pages: sb.book.pages,
        })),
        topProlificAuthors: topProlificAuthors.map((author) => ({
            name: author.name,
            bookCount: author.bookCount,
        })),
    };
};

export const generatePDFReport = async (reportData: StoreReportData): Promise<Buffer> => {
    return new Promise(async (resolve, reject) => {
        try {
            const doc = new PDFDocument({ margin: 50 });
            const chunks: Buffer[] = [];

            doc.on('data', (chunk) => chunks.push(chunk));
            doc.on('end', () => resolve(Buffer.concat(chunks)));
            doc.on('error', reject);

            // Add store logo if available
            if (reportData.store.logo) {
                try {
                    // Try to fetch and add the logo
                    const logoResponse = await fetch(reportData.store.logo);
                    if (logoResponse.ok) {
                        const logoBuffer = Buffer.from(await logoResponse.arrayBuffer());
                        doc.image(logoBuffer, 50, 50, { width: 80, height: 80 });
                        doc.moveDown(6);
                    }
                } catch (logoError) {
                    // If logo fails to load, just continue without it
                    console.warn('Failed to load store logo:', logoError);
                }
            }

            // Store name and header
            doc.fontSize(24).font('Helvetica-Bold').text(reportData.store.name, { align: 'center' });
            doc.moveDown(0.5);
            doc.fontSize(12).font('Helvetica').text(reportData.store.address, { align: 'center' });
            doc.moveDown(0.5);

            // Report date
            const reportDate = new Date().toISOString().split('T')[0];
            doc.fontSize(10).text(`Report Generated: ${reportDate}`, { align: 'center' });
            doc.moveDown(2);

            // Horizontal line
            doc.strokeColor('#333333').lineWidth(1).moveTo(50, doc.y).lineTo(550, doc.y).stroke();
            doc.moveDown(1);

            // Top 5 Priciest Books Section
            doc.fontSize(16).font('Helvetica-Bold').text('Top 5 Priciest Books', { underline: true });
            doc.moveDown(0.5);

            if (reportData.topPriciestBooks.length === 0) {
                doc.fontSize(11).font('Helvetica').text('No books available in inventory.');
            } else {
                // Table header
                doc.fontSize(10).font('Helvetica-Bold');
                const tableTop = doc.y;
                doc.text('#', 50, tableTop);
                doc.text('Book Name', 70, tableTop);
                doc.text('Author', 250, tableTop);
                doc.text('Pages', 380, tableTop);
                doc.text('Price', 430, tableTop);
                doc.moveDown(0.5);

                // Underline
                doc.strokeColor('#cccccc').lineWidth(0.5).moveTo(50, doc.y).lineTo(550, doc.y).stroke();
                doc.moveDown(0.5);

                doc.font('Helvetica').fontSize(10);
                reportData.topPriciestBooks.forEach((book, index) => {
                    const y = doc.y;
                    doc.text(`${index + 1}`, 50, y);
                    doc.text(book.name.substring(0, 30), 70, y);
                    doc.text(book.authorName.substring(0, 20), 250, y);
                    doc.text(`${book.pages}`, 380, y);
                    doc.text(`$${book.price.toFixed(2)}`, 430, y);
                    doc.moveDown(0.8);
                });
            }

            doc.moveDown(2);

            // Horizontal line
            doc.strokeColor('#333333').lineWidth(1).moveTo(50, doc.y).lineTo(550, doc.y).stroke();
            doc.moveDown(1);

            // Top 5 Prolific Authors Section
            doc.fontSize(16).font('Helvetica-Bold').text('Top 5 Prolific Authors', { underline: true });
            doc.moveDown(0.5);

            if (reportData.topProlificAuthors.length === 0) {
                doc.fontSize(11).font('Helvetica').text('No authors with available books in inventory.');
            } else {
                // Table header
                doc.fontSize(10).font('Helvetica-Bold');
                const authorTableTop = doc.y;
                doc.text('#', 50, authorTableTop);
                doc.text('Author Name', 70, authorTableTop);
                doc.text('Number of Books', 350, authorTableTop);
                doc.moveDown(0.5);

                // Underline
                doc.strokeColor('#cccccc').lineWidth(0.5).moveTo(50, doc.y).lineTo(550, doc.y).stroke();
                doc.moveDown(0.5);

                doc.font('Helvetica').fontSize(10);
                reportData.topProlificAuthors.forEach((author, index) => {
                    const y = doc.y;
                    doc.text(`${index + 1}`, 50, y);
                    doc.text(author.name, 70, y);
                    doc.text(`${author.bookCount}`, 350, y);
                    doc.moveDown(0.8);
                });
            }

            doc.moveDown(2);

            // Footer
            doc.fontSize(8)
                .font('Helvetica')
                .text('This report was automatically generated by the Inventory Management System.', {
                    align: 'center',
                });

            doc.end();
        } catch (error) {
            reject(error);
        }
    });
};

export const generateReportFilename = (storeName: string): string => {
    const sanitizedStoreName = storeName.replace(/[^a-zA-Z0-9]/g, '-').replace(/-+/g, '-');
    const date = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
    return `${sanitizedStoreName}-Report-${date}.pdf`;
};

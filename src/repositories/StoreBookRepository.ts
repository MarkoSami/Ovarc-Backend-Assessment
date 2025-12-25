import { Transaction, FindOptions, Op } from 'sequelize';
import { BaseRepository } from './BaseRepository';
import { StoreBook, Store, Book, Author } from '../models';
import { StoreBookAttributes } from '../models/StoreBook';
import { StoreBookWithDetails } from '../interfaces';

/**
 * Creation attributes for StoreBook (excluding auto-generated fields)
 */
export interface StoreBookCreationData {
    storeId: string;
    bookId: string;
    price: number;
    copies: number;
    soldOut?: boolean;
}

/**
 * Repository for StoreBook entity
 * Handles all database operations for store-book relationships
 */
export class StoreBookRepository extends BaseRepository<StoreBook, StoreBookAttributes, StoreBookCreationData> {
    constructor() {
        super(StoreBook);
    }

    /**
     * Find a store-book relationship by store ID and book ID
     */
    async findByStoreAndBook(
        storeId: string,
        bookId: string,
        transaction?: Transaction | null
    ): Promise<StoreBook | null> {
        return this.findOne(
            {
                where: { storeId, bookId },
            },
            transaction
        );
    }

    /**
     * Create a store-book relationship
     */
    async createStoreBook(data: StoreBookCreationData, transaction?: Transaction | null): Promise<StoreBook> {
        return this.create(
            {
                storeId: data.storeId,
                bookId: data.bookId,
                price: data.price,
                copies: data.copies,
                soldOut: data.soldOut ?? false,
            },
            transaction
        );
    }

    /**
     * Find or create a store-book relationship
     */
    async findOrCreateStoreBook(
        data: StoreBookCreationData,
        transaction?: Transaction | null
    ): Promise<{ storeBook: StoreBook; created: boolean }> {
        const { instance, created } = await this.findOrCreate(
            { storeId: data.storeId, bookId: data.bookId },
            {
                storeId: data.storeId,
                bookId: data.bookId,
                price: data.price,
                copies: data.copies,
                soldOut: data.soldOut ?? false,
            },
            transaction
        );
        return { storeBook: instance, created };
    }

    /**
     * Update copies count for a store-book relationship
     */
    async updateCopies(
        id: string,
        copies: number,
        transaction?: Transaction | null
    ): Promise<StoreBook | null> {
        return this.update(id, { copies, soldOut: copies <= 0 }, transaction);
    }

    /**
     * Increment copies for a store-book relationship
     */
    async incrementCopies(
        id: string,
        incrementBy: number,
        transaction?: Transaction | null
    ): Promise<StoreBook | null> {
        const storeBook = await this.findById(id, transaction);
        if (!storeBook) {
            return null;
        }

        const newCopies = storeBook.copies + incrementBy;
        await storeBook.update(
            { copies: newCopies, soldOut: newCopies <= 0 },
            { transaction: transaction ?? null }
        );
        return storeBook;
    }

    /**
     * Get store books with full details (store, book, author)
     */
    async findByStoreWithDetails(
        storeId: string,
        transaction?: Transaction | null
    ): Promise<StoreBookWithDetails[]> {
        return this.findAll(
            {
                where: { storeId },
                include: [
                    { model: Store, as: 'store' },
                    {
                        model: Book,
                        as: 'book',
                        include: [{ model: Author, as: 'author' }],
                    },
                ],
            },
            transaction
        ) as Promise<StoreBookWithDetails[]>;
    }

    /**
     * Get all store books for a store
     */
    async findByStoreId(storeId: string, transaction?: Transaction | null): Promise<StoreBook[]> {
        return this.findAll(
            {
                where: { storeId },
            },
            transaction
        );
    }

    /**
     * Get all store books for a book
     */
    async findByBookId(bookId: string, transaction?: Transaction | null): Promise<StoreBook[]> {
        return this.findAll(
            {
                where: { bookId },
            },
            transaction
        );
    }

    /**
     * Get top priciest books in a store
     */
    async findTopPriciestByStore(
        storeId: string,
        limit: number = 10,
        transaction?: Transaction | null
    ): Promise<StoreBookWithDetails[]> {
        return this.findAll(
            {
                where: { storeId },
                include: [
                    {
                        model: Book,
                        as: 'book',
                        include: [{ model: Author, as: 'author' }],
                    },
                ],
                order: [['price', 'DESC']],
                limit,
            },
            transaction
        ) as Promise<StoreBookWithDetails[]>;
    }

    /**
     * Get all store books with book and author details (for aggregation queries)
     */
    async findByStoreWithBookAndAuthor(
        storeId: string,
        transaction?: Transaction | null
    ): Promise<StoreBookWithDetails[]> {
        return this.findAll(
            {
                where: { storeId },
                include: [
                    {
                        model: Book,
                        as: 'book',
                        include: [{ model: Author, as: 'author' }],
                    },
                ],
            },
            transaction
        ) as Promise<StoreBookWithDetails[]>;
    }

    /**
     * Count store books in a store
     */
    async countByStore(storeId: string, transaction?: Transaction | null): Promise<number> {
        return this.count(
            {
                where: { storeId },
            },
            transaction
        );
    }

    /**
     * Get total copies in a store
     */
    async getTotalCopiesByStore(storeId: string, transaction?: Transaction | null): Promise<number> {
        const storeBooks = await this.findByStoreId(storeId, transaction);
        return storeBooks.reduce((sum, sb) => sum + sb.copies, 0);
    }

    /**
     * Update price for a store-book relationship
     */
    async updatePrice(
        id: string,
        price: number,
        transaction?: Transaction | null
    ): Promise<StoreBook | null> {
        return this.update(id, { price }, transaction);
    }

    /**
     * Update sold out status
     */
    async updateSoldOut(
        id: string,
        soldOut: boolean,
        transaction?: Transaction | null
    ): Promise<StoreBook | null> {
        return this.update(id, { soldOut }, transaction);
    }
}

// Export singleton instance
export const storeBookRepository = new StoreBookRepository();

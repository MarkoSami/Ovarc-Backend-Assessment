import { Transaction, Op } from 'sequelize';
import { Store, StoreBook } from '../models';
import {
    storeRepository,
    storeBookRepository,
    StoreBookWithDetails,
} from '../repositories';
import { CreateStoreData, CreateStoreBookData, TopProlificAuthor } from '../interfaces';

// ==================== STORE OPERATIONS ====================

/**
 * Find a store by ID
 */
export const findStoreById = async (id: string, transaction?: Transaction | null): Promise<Store | null> => {
    return storeRepository.findById(id, transaction);
};

/**
 * Find a store by name
 */
export const findStoreByName = async (name: string, transaction?: Transaction | null): Promise<Store | null> => {
    return storeRepository.findByName(name, transaction);
};

/**
 * Create a new store
 */
export const createStore = async (data: CreateStoreData, transaction?: Transaction | null): Promise<Store> => {
    return storeRepository.createStore(
        {
            name: data.name,
            address: data.address,
            ...(data.logo ? { logo: data.logo } : {}),
        },
        transaction
    );
};

/**
 * Find a store by name or create one if it doesn't exist
 * Returns the store and a boolean indicating if it was created
 */
export const findOrCreateStore = async (
    data: CreateStoreData,
    transaction?: Transaction | null
): Promise<{ store: Store; created: boolean }> => {
    return storeRepository.findOrCreateByName(
        {
            name: data.name,
            address: data.address,
            ...(data.logo ? { logo: data.logo } : {}),
        },
        transaction
    );
};

/**
 * Get all stores
 */
export const getAllStores = async (transaction?: Transaction | null): Promise<Store[]> => {
    return storeRepository.findAll({}, transaction);
};

/**
 * Update a store by ID
 */
export const updateStore = async (
    id: string,
    data: Partial<CreateStoreData>,
    transaction?: Transaction | null
): Promise<Store | null> => {
    return storeRepository.updateStore(id, data, transaction);
};

/**
 * Delete a store by ID
 */
export const deleteStore = async (id: string, transaction?: Transaction | null): Promise<boolean> => {
    return storeRepository.delete(id, transaction);
};

// ==================== STORE-BOOK OPERATIONS ====================

/**
 * Find a store-book relationship
 */
export const findStoreBook = async (
    storeId: string,
    bookId: string,
    transaction?: Transaction | null
): Promise<StoreBook | null> => {
    return storeBookRepository.findByStoreAndBook(storeId, bookId, transaction);
};

/**
 * Create a store-book relationship
 */
export const createStoreBook = async (
    data: CreateStoreBookData,
    transaction?: Transaction | null
): Promise<StoreBook> => {
    return storeBookRepository.createStoreBook(
        {
            storeId: data.storeId,
            bookId: data.bookId,
            price: data.price,
            copies: data.copies ?? 1,
            soldOut: false,
        },
        transaction
    );
};

/**
 * Find or create a store-book relationship
 * If exists, increments copies by 1
 */
export const findOrCreateStoreBook = async (
    data: CreateStoreBookData,
    transaction?: Transaction | null
): Promise<{ storeBook: StoreBook; created: boolean; updated: boolean }> => {
    const existingStoreBook = await storeBookRepository.findByStoreAndBook(data.storeId, data.bookId, transaction);

    if (existingStoreBook) {
        // Increment copies using the repository's update method
        const newCopies = existingStoreBook.copies + 1;
        await existingStoreBook.update(
            {
                copies: newCopies,
                price: data.price, // Update price to latest
                soldOut: false, // Reset sold out status when adding copies
            },
            { transaction: transaction ?? null }
        );
        return { storeBook: existingStoreBook, created: false, updated: true };
    }

    // Create new store-book relationship
    const storeBook = await storeBookRepository.createStoreBook(
        {
            storeId: data.storeId,
            bookId: data.bookId,
            price: data.price,
            copies: data.copies ?? 1,
            soldOut: false,
        },
        transaction
    );

    return { storeBook, created: true, updated: false };
};

/**
 * Update store-book copies
 */
export const updateStoreBookCopies = async (
    storeId: string,
    bookId: string,
    copies: number,
    transaction?: Transaction | null
): Promise<StoreBook | null> => {
    const storeBook = await storeBookRepository.findByStoreAndBook(storeId, bookId, transaction);

    if (!storeBook) {
        return null;
    }

    await storeBook.update(
        { copies, soldOut: copies === 0 },
        { transaction: transaction ?? null }
    );

    return storeBook;
};

/**
 * Increment store-book copies
 */
export const incrementStoreBookCopies = async (
    storeId: string,
    bookId: string,
    amount: number = 1,
    transaction?: Transaction | null
): Promise<StoreBook | null> => {
    const storeBook = await storeBookRepository.findByStoreAndBook(storeId, bookId, transaction);

    if (!storeBook) {
        return null;
    }

    const newCopies = storeBook.copies + amount;
    await storeBook.update(
        { copies: newCopies, soldOut: false },
        { transaction: transaction ?? null }
    );

    return storeBook;
};

/**
 * Get all books for a store with details
 */
export const getStoreBooksWithDetails = async (
    storeId: string,
    transaction?: Transaction | null
): Promise<StoreBookWithDetails[]> => {
    return storeBookRepository.findByStoreWithDetails(storeId, transaction);
};

/**
 * Get top N priciest books for a store
 */
export const getTopPriciestBooks = async (
    storeId: string,
    limit: number = 5,
    transaction?: Transaction | null
): Promise<StoreBookWithDetails[]> => {
    return storeBookRepository.findTopPriciestByStore(storeId, limit, transaction);
};

/**
 * Get top N prolific authors for a store (by number of available books)
 */
export const getTopProlificAuthors = async (
    storeId: string,
    limit: number = 5,
    transaction?: Transaction | null
): Promise<TopProlificAuthor[]> => {
    // Get store books with author details using repository
    const storeBooks = await storeBookRepository.findByStoreWithBookAndAuthor(storeId, transaction);

    // Filter for books with copies > 0
    const availableBooks = storeBooks.filter((sb) => sb.copies > 0);

    // Aggregate author book counts in JavaScript
    const authorBookMap = new Map<string, { id: string; name: string; bookIds: Set<string> }>();

    for (const sb of availableBooks as any[]) {
        if (sb.book?.author) {
            const authorId = sb.book.author.id;
            const authorName = sb.book.author.name;
            const bookId = sb.book.id;

            if (!authorBookMap.has(authorId)) {
                authorBookMap.set(authorId, {
                    id: authorId,
                    name: authorName,
                    bookIds: new Set(),
                });
            }
            authorBookMap.get(authorId)!.bookIds.add(bookId);
        }
    }

    // Convert to array, calculate counts, sort and limit
    const authors = Array.from(authorBookMap.values())
        .map((author) => ({
            id: author.id,
            name: author.name,
            bookCount: author.bookIds.size,
        }))
        .sort((a, b) => b.bookCount - a.bookCount)
        .slice(0, limit);

    return authors;
};

/**
 * Delete a store-book relationship
 */
export const deleteStoreBook = async (
    storeId: string,
    bookId: string,
    transaction?: Transaction | null
): Promise<boolean> => {
    const storeBook = await storeBookRepository.findByStoreAndBook(storeId, bookId, transaction);

    if (!storeBook) {
        return false;
    }

    await storeBook.destroy({ transaction: transaction ?? null });
    return true;
};

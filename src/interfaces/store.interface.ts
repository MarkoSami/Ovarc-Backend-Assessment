import { StoreBook, Book, Author } from '../models';

// Store-related interfaces

export interface CreateStoreData {
    name: string;
    address: string;
    logo?: string;
}

export interface CreateStoreBookData {
    storeId: string;
    bookId: string;
    price: number;
    copies?: number;
}

export interface StoreBookWithDetails extends StoreBook {
    book?: Book & { author?: Author };
}

export interface TopProlificAuthor {
    id: string;
    name: string;
    bookCount: number;
}

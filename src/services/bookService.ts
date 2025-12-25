import { Transaction } from 'sequelize';
import { Book } from '../models';
import { bookRepository, BookWithAuthor } from '../repositories';
import { CreateBookData } from '../interfaces';

/**
 * Find a book by ID
 */
export const findBookById = async (
    id: string,
    includeAuthor: boolean = false,
    transaction?: Transaction | null
): Promise<BookWithAuthor | null> => {
    return bookRepository.findByIdWithAuthor(id, includeAuthor, transaction);
};

/**
 * Find a book by name and author ID
 */
export const findBookByNameAndAuthor = async (
    name: string,
    authorId: string,
    transaction?: Transaction | null
): Promise<Book | null> => {
    return bookRepository.findByNameAndAuthor(name, authorId, transaction);
};

/**
 * Create a new book
 */
export const createBook = async (data: CreateBookData, transaction?: Transaction | null): Promise<Book> => {
    return bookRepository.createBook(data, transaction);
};

/**
 * Find a book by name and author or create one if it doesn't exist
 * Returns the book and a boolean indicating if it was created
 */
export const findOrCreateBook = async (
    data: CreateBookData,
    transaction?: Transaction | null
): Promise<{ book: Book; created: boolean }> => {
    return bookRepository.findOrCreateBook(data, transaction);
};

/**
 * Get all books
 */
export const getAllBooks = async (
    includeAuthor: boolean = false,
    transaction?: Transaction | null
): Promise<BookWithAuthor[]> => {
    return bookRepository.findAllWithAuthor(includeAuthor, transaction);
};

/**
 * Get books by author ID
 */
export const getBooksByAuthor = async (authorId: string, transaction?: Transaction | null): Promise<Book[]> => {
    return bookRepository.findByAuthorId(authorId, transaction);
};

/**
 * Update a book by ID
 */
export const updateBook = async (
    id: string,
    data: Partial<CreateBookData>,
    transaction?: Transaction | null
): Promise<Book | null> => {
    return bookRepository.updateBook(id, data, transaction);
};

/**
 * Delete a book by ID
 */
export const deleteBook = async (id: string, transaction?: Transaction | null): Promise<boolean> => {
    return bookRepository.delete(id, transaction);
};

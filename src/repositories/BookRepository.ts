import { Transaction, FindOptions } from 'sequelize';
import { BaseRepository } from './BaseRepository';
import { Book, Author } from '../models';
import { BookAttributes } from '../models/Book';
import { BookWithAuthor } from '../interfaces';

/**
 * Creation attributes for Book (excluding auto-generated fields)
 */
export interface BookCreationData {
    name: string;
    pages: number;
    authorId: string;
}

/**
 * Repository for Book entity
 * Handles all database operations for books
 */
export class BookRepository extends BaseRepository<Book, BookAttributes, BookCreationData> {
    constructor() {
        super(Book);
    }

    /**
     * Find a book by ID with optional author inclusion
     */
    async findByIdWithAuthor(
        id: string,
        includeAuthor: boolean = false,
        transaction?: Transaction | null
    ): Promise<BookWithAuthor | null> {
        const options: FindOptions = {};
        if (includeAuthor) {
            options.include = [{ model: Author, as: 'author' }];
        }
        return this.model.findByPk(id, {
            ...options,
            transaction: transaction ?? null,
        }) as Promise<BookWithAuthor | null>;
    }

    /**
     * Find a book by name and author ID
     */
    async findByNameAndAuthor(
        name: string,
        authorId: string,
        transaction?: Transaction | null
    ): Promise<Book | null> {
        return this.findOne(
            {
                where: {
                    name: name.trim(),
                    authorId,
                },
            },
            transaction
        );
    }

    /**
     * Create a book with trimmed name
     */
    async createBook(data: BookCreationData, transaction?: Transaction | null): Promise<Book> {
        return this.create(
            {
                name: data.name.trim(),
                pages: data.pages,
                authorId: data.authorId,
            },
            transaction
        );
    }

    /**
     * Find or create a book by name and author
     */
    async findOrCreateBook(
        data: BookCreationData,
        transaction?: Transaction | null
    ): Promise<{ book: Book; created: boolean }> {
        const trimmedName = data.name.trim();
        const { instance, created } = await this.findOrCreate(
            { name: trimmedName, authorId: data.authorId },
            {
                name: trimmedName,
                pages: data.pages,
                authorId: data.authorId,
            },
            transaction
        );
        return { book: instance, created };
    }

    /**
     * Get all books with optional author inclusion
     */
    async findAllWithAuthor(
        includeAuthor: boolean = false,
        transaction?: Transaction | null
    ): Promise<BookWithAuthor[]> {
        const options: FindOptions = {};
        if (includeAuthor) {
            options.include = [{ model: Author, as: 'author' }];
        }
        return this.findAll(options, transaction) as Promise<BookWithAuthor[]>;
    }

    /**
     * Get books by author ID
     */
    async findByAuthorId(authorId: string, transaction?: Transaction | null): Promise<Book[]> {
        return this.findAll(
            {
                where: { authorId },
            },
            transaction
        );
    }

    /**
     * Update book details
     */
    async updateBook(
        id: string,
        data: Partial<BookCreationData>,
        transaction?: Transaction | null
    ): Promise<Book | null> {
        const updateData: Partial<BookAttributes> = {};

        if (data.name !== undefined) {
            updateData.name = data.name.trim();
        }
        if (data.pages !== undefined) {
            updateData.pages = data.pages;
        }
        if (data.authorId !== undefined) {
            updateData.authorId = data.authorId;
        }

        return this.update(id, updateData, transaction);
    }

    /**
     * Count books by author
     */
    async countByAuthor(authorId: string, transaction?: Transaction | null): Promise<number> {
        return this.count(
            {
                where: { authorId },
            },
            transaction
        );
    }
}

// Export singleton instance
export const bookRepository = new BookRepository();

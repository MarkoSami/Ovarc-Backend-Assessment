import { Transaction } from 'sequelize';
import { BaseRepository } from './BaseRepository';
import { Author } from '../models';
import { AuthorAttributes } from '../models/Author';

/**
 * Creation attributes for Author (excluding auto-generated fields)
 */
export interface AuthorCreationData {
    name: string;
}

/**
 * Repository for Author entity
 * Handles all database operations for authors
 */
export class AuthorRepository extends BaseRepository<Author, AuthorAttributes, AuthorCreationData> {
    constructor() {
        super(Author);
    }

    /**
     * Find an author by name
     */
    async findByName(name: string, transaction?: Transaction | null): Promise<Author | null> {
        return this.findOne(
            {
                where: { name: name.trim() },
            },
            transaction
        );
    }

    /**
     * Create an author with trimmed name
     */
    async createAuthor(name: string, transaction?: Transaction | null): Promise<Author> {
        return this.create({ name: name.trim() }, transaction);
    }

    /**
     * Find or create an author by name
     */
    async findOrCreateByName(
        name: string,
        transaction?: Transaction | null
    ): Promise<{ author: Author; created: boolean }> {
        const trimmedName = name.trim();
        const { instance, created } = await this.findOrCreate(
            { name: trimmedName },
            { name: trimmedName },
            transaction
        );
        return { author: instance, created };
    }

    /**
     * Update an author's name
     */
    async updateName(id: string, name: string, transaction?: Transaction | null): Promise<Author | null> {
        return this.update(id, { name: name.trim() }, transaction);
    }
}

// Export singleton instance
export const authorRepository = new AuthorRepository();

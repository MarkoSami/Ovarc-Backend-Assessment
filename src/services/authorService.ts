import { Transaction } from 'sequelize';
import { Author } from '../models';
import { authorRepository } from '../repositories';
import { CreateAuthorData } from '../interfaces';

/**
 * Find an author by ID
 */
export const findAuthorById = async (id: string, transaction?: Transaction | null): Promise<Author | null> => {
    return authorRepository.findById(id, transaction);
};

/**
 * Find an author by name
 */
export const findAuthorByName = async (name: string, transaction?: Transaction | null): Promise<Author | null> => {
    return authorRepository.findByName(name, transaction);
};

/**
 * Create a new author
 */
export const createAuthor = async (data: CreateAuthorData, transaction?: Transaction | null): Promise<Author> => {
    return authorRepository.createAuthor(data.name, transaction);
};

/**
 * Find an author by name or create one if it doesn't exist
 * Returns the author and a boolean indicating if it was created
 */
export const findOrCreateAuthor = async (
    name: string,
    transaction?: Transaction | null
): Promise<{ author: Author; created: boolean }> => {
    return authorRepository.findOrCreateByName(name, transaction);
};

/**
 * Get all authors
 */
export const getAllAuthors = async (transaction?: Transaction | null): Promise<Author[]> => {
    return authorRepository.findAll({}, transaction);
};

/**
 * Update an author by ID
 */
export const updateAuthor = async (
    id: string,
    data: Partial<CreateAuthorData>,
    transaction?: Transaction | null
): Promise<Author | null> => {
    if (data.name) {
        return authorRepository.updateName(id, data.name, transaction);
    }
    return authorRepository.findById(id, transaction);
};

/**
 * Delete an author by ID
 */
export const deleteAuthor = async (id: string, transaction?: Transaction | null): Promise<boolean> => {
    return authorRepository.delete(id, transaction);
};

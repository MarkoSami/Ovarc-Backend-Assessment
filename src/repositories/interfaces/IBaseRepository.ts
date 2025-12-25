import { Transaction, FindOptions, CreateOptions, UpdateOptions, DestroyOptions } from 'sequelize';
import { Model, ModelStatic } from 'sequelize';

/**
 * Base repository interface defining common CRUD operations
 * All entity repositories should extend this interface
 */
export interface IBaseRepository<T extends Model, TAttributes, TCreationAttributes> {
    /**
     * Find a record by its primary key
     */
    findById(id: string, transaction?: Transaction | null): Promise<T | null>;

    /**
     * Find all records
     */
    findAll(options?: FindOptions, transaction?: Transaction | null): Promise<T[]>;

    /**
     * Find one record matching the criteria
     */
    findOne(options: FindOptions, transaction?: Transaction | null): Promise<T | null>;

    /**
     * Create a new record
     */
    create(data: TCreationAttributes, transaction?: Transaction | null): Promise<T>;

    /**
     * Update an existing record
     */
    update(id: string, data: Partial<TAttributes>, transaction?: Transaction | null): Promise<T | null>;

    /**
     * Delete a record by ID
     */
    delete(id: string, transaction?: Transaction | null): Promise<boolean>;

    /**
     * Find or create a record
     */
    findOrCreate(
        where: Partial<TAttributes>,
        defaults: TCreationAttributes,
        transaction?: Transaction | null
    ): Promise<{ instance: T; created: boolean }>;

    /**
     * Count records matching criteria
     */
    count(options?: FindOptions, transaction?: Transaction | null): Promise<number>;
}

/**
 * Type for pagination options
 */
export interface PaginationOptions {
    page?: number;
    limit?: number;
}

/**
 * Type for paginated result
 */
export interface PaginatedResult<T> {
    data: T[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

import { Transaction, FindOptions, WhereOptions } from 'sequelize';
import { Model, ModelStatic } from 'sequelize';
import { IBaseRepository, PaginationOptions, PaginatedResult } from './interfaces/IBaseRepository';

/**
 * Abstract base repository implementing common CRUD operations
 * All entity repositories should extend this class
 */
export abstract class BaseRepository<T extends Model, TAttributes, TCreationAttributes>
    implements IBaseRepository<T, TAttributes, TCreationAttributes> {
    protected model: ModelStatic<T>;

    constructor(model: ModelStatic<T>) {
        this.model = model;
    }

    /**
     * Find a record by its primary key
     */
    async findById(id: string, transaction?: Transaction | null): Promise<T | null> {
        return this.model.findByPk(id, { transaction: transaction ?? null });
    }

    /**
     * Find all records with optional filtering
     */
    async findAll(options?: FindOptions, transaction?: Transaction | null): Promise<T[]> {
        return this.model.findAll({
            ...options,
            transaction: transaction ?? null,
        });
    }

    /**
     * Find one record matching the criteria
     */
    async findOne(options: FindOptions, transaction?: Transaction | null): Promise<T | null> {
        return this.model.findOne({
            ...options,
            transaction: transaction ?? null,
        });
    }

    /**
     * Create a new record
     */
    async create(data: TCreationAttributes, transaction?: Transaction | null): Promise<T> {
        return this.model.create(data as any, { transaction: transaction ?? null });
    }

    /**
     * Update an existing record by ID
     */
    async update(id: string, data: Partial<TAttributes>, transaction?: Transaction | null): Promise<T | null> {
        const instance = await this.model.findByPk(id, { transaction: transaction ?? null });
        if (!instance) {
            return null;
        }

        await instance.update(data as any, { transaction: transaction ?? null });
        return instance;
    }

    /**
     * Delete a record by ID
     */
    async delete(id: string, transaction?: Transaction | null): Promise<boolean> {
        const instance = await this.model.findByPk(id, { transaction: transaction ?? null });
        if (!instance) {
            return false;
        }

        await instance.destroy({ transaction: transaction ?? null });
        return true;
    }

    /**
     * Find or create a record
     */
    async findOrCreate(
        where: Partial<TAttributes>,
        defaults: TCreationAttributes,
        transaction?: Transaction | null
    ): Promise<{ instance: T; created: boolean }> {
        const [instance, created] = await this.model.findOrCreate({
            where: where as WhereOptions,
            defaults: defaults as any,
            transaction: transaction ?? null,
        });

        return { instance, created };
    }

    /**
     * Count records matching criteria
     */
    async count(options?: FindOptions, transaction?: Transaction | null): Promise<number> {
        return this.model.count({
            ...options,
            transaction: transaction ?? null,
        });
    }

    /**
     * Find all records with pagination
     */
    async findAllPaginated(
        options?: FindOptions,
        pagination?: PaginationOptions,
        transaction?: Transaction | null
    ): Promise<PaginatedResult<T>> {
        const page = pagination?.page ?? 1;
        const limit = pagination?.limit ?? 10;
        const offset = (page - 1) * limit;

        const { count, rows } = await this.model.findAndCountAll({
            ...options,
            limit,
            offset,
            transaction: transaction ?? null,
        });

        return {
            data: rows,
            total: count as number,
            page,
            limit,
            totalPages: Math.ceil((count as number) / limit),
        };
    }

    /**
     * Bulk create records
     */
    async bulkCreate(data: TCreationAttributes[], transaction?: Transaction | null): Promise<T[]> {
        return this.model.bulkCreate(data as any[], { transaction: transaction ?? null });
    }

    /**
     * Check if a record exists
     */
    async exists(where: Partial<TAttributes>, transaction?: Transaction | null): Promise<boolean> {
        const count = await this.model.count({
            where: where as WhereOptions,
            transaction: transaction ?? null,
        });
        return count > 0;
    }
}

import { Transaction, FindOptions } from 'sequelize';
import { BaseRepository } from './BaseRepository';
import { Store } from '../models';
import { StoreAttributes } from '../models/Store';

/**
 * Creation attributes for Store (excluding auto-generated fields)
 */
export interface StoreCreationData {
    name: string;
    address: string;
    logo?: string;
}

/**
 * Repository for Store entity
 * Handles all database operations for stores
 */
export class StoreRepository extends BaseRepository<Store, StoreAttributes, StoreCreationData> {
    constructor() {
        super(Store);
    }

    /**
     * Find a store by name
     */
    async findByName(name: string, transaction?: Transaction | null): Promise<Store | null> {
        return this.findOne(
            {
                where: { name: name.trim() },
            },
            transaction
        );
    }

    /**
     * Create a store with trimmed name
     */
    async createStore(data: StoreCreationData, transaction?: Transaction | null): Promise<Store> {
        const createData: StoreCreationData = {
            name: data.name.trim(),
            address: data.address.trim(),
            ...(data.logo ? { logo: data.logo } : {}),
        };
        return this.create(createData, transaction);
    }

    /**
     * Find or create a store by name
     */
    async findOrCreateByName(
        data: StoreCreationData,
        transaction?: Transaction | null
    ): Promise<{ store: Store; created: boolean }> {
        const trimmedName = data.name.trim();
        const defaults: StoreCreationData = {
            name: trimmedName,
            address: data.address.trim(),
            ...(data.logo ? { logo: data.logo } : {}),
        };

        const { instance, created } = await this.findOrCreate(
            { name: trimmedName },
            defaults,
            transaction
        );
        return { store: instance, created };
    }

    /**
     * Update store details
     */
    async updateStore(
        id: string,
        data: Partial<StoreCreationData>,
        transaction?: Transaction | null
    ): Promise<Store | null> {
        const updateData: Partial<StoreAttributes> = {};

        if (data.name !== undefined) {
            updateData.name = data.name.trim();
        }
        if (data.address !== undefined) {
            updateData.address = data.address.trim();
        }
        if (data.logo !== undefined) {
            updateData.logo = data.logo;
        }

        return this.update(id, updateData, transaction);
    }

    /**
     * Search stores by name (partial match)
     */
    async searchByName(
        searchTerm: string,
        transaction?: Transaction | null
    ): Promise<Store[]> {
        const { Op } = await import('sequelize');
        return this.findAll(
            {
                where: {
                    name: {
                        [Op.iLike]: `%${searchTerm.trim()}%`,
                    },
                },
            },
            transaction
        );
    }
}

// Export singleton instance
export const storeRepository = new StoreRepository();

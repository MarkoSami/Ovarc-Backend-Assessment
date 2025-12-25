import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../db';

export interface StoreAttributes {
    id: string;
    name: string;
    address: string;
    logo?: string;
    createdAt?: Date;
    updatedAt?: Date;
}

interface StoreCreationAttributes extends Optional<StoreAttributes, 'id' | 'logo'> { }

class Store extends Model<StoreAttributes, StoreCreationAttributes> implements StoreAttributes {
    public id!: string;
    public name!: string;
    public address!: string;
    public logo?: string;
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
}

Store.init(
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        name: {
            type: DataTypes.STRING(255),
            allowNull: false,
        },
        address: {
            type: DataTypes.TEXT,
            allowNull: false,
        },
        logo: {
            type: DataTypes.STRING(500),
            allowNull: true,
        },
    },
    {
        sequelize,
        tableName: 'stores',
        timestamps: true,
    }
);

export default Store;

import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../db';

export interface StoreBookAttributes {
    id: string;
    storeId: string;
    bookId: string;
    price: number;
    copies: number;
    soldOut: boolean;
    createdAt?: Date;
    updatedAt?: Date;
}

interface StoreBookCreationAttributes extends Optional<StoreBookAttributes, 'id' | 'soldOut'> { }

class StoreBook extends Model<StoreBookAttributes, StoreBookCreationAttributes> implements StoreBookAttributes {
    public id!: string;
    public storeId!: string;
    public bookId!: string;
    public price!: number;
    public copies!: number;
    public soldOut!: boolean;
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
}

StoreBook.init(
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        storeId: {
            type: DataTypes.UUID,
            allowNull: false,
            field: 'store_id',
            references: {
                model: 'stores',
                key: 'id',
            },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE',
        },
        bookId: {
            type: DataTypes.UUID,
            allowNull: false,
            field: 'book_id',
            references: {
                model: 'books',
                key: 'id',
            },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE',
        },
        price: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
            validate: {
                min: 0,
            },
        },
        copies: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
            validate: {
                min: 0,
            },
        },
        soldOut: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
            field: 'sold_out',
        },
    },
    {
        sequelize,
        tableName: 'store_books',
        timestamps: true,
        indexes: [
            {
                unique: true,
                fields: ['store_id', 'book_id'],
            },
        ],
    }
);

export default StoreBook;

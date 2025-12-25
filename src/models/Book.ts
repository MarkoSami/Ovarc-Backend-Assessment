import { Model, DataTypes, Optional, Association } from 'sequelize';
import { sequelize } from '../db';
import Author from './Author';

interface BookAttributes {
    id: string;
    name: string;
    pages: number;
    authorId: string;
    createdAt?: Date;
    updatedAt?: Date;
}

interface BookCreationAttributes extends Optional<BookAttributes, 'id'> { }

class Book extends Model<BookAttributes, BookCreationAttributes> implements BookAttributes {
    public id!: string;
    public name!: string;
    public pages!: number;
    public authorId!: string;
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;

    // Association placeholder
    public readonly author?: Author;

    public static associations: {
        author: Association<Book, Author>;
    };
}

Book.init(
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
        pages: {
            type: DataTypes.INTEGER,
            allowNull: false,
            validate: {
                min: 1,
            },
        },
        authorId: {
            type: DataTypes.UUID,
            allowNull: false,
            field: 'author_id',
            references: {
                model: 'authors',
                key: 'id',
            },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE',
        },
    },
    {
        sequelize,
        tableName: 'books',
        timestamps: true,
    }
);

export default Book;

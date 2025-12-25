import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../db';

export interface AuthorAttributes {
    id: string;
    name: string;
    createdAt?: Date;
    updatedAt?: Date;
}

interface AuthorCreationAttributes extends Optional<AuthorAttributes, 'id'> { }

class Author extends Model<AuthorAttributes, AuthorCreationAttributes> implements AuthorAttributes {
    public id!: string;
    public name!: string;
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
}

Author.init(
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
    },
    {
        sequelize,
        tableName: 'authors',
        timestamps: true,
    }
);

export default Author;

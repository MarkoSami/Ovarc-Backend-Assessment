'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('store_books', {
            id: {
                type: Sequelize.UUID,
                defaultValue: Sequelize.UUIDV4,
                primaryKey: true,
                allowNull: false
            },
            store_id: {
                type: Sequelize.UUID,
                allowNull: false,
                references: {
                    model: 'stores',
                    key: 'id'
                },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE'
            },
            book_id: {
                type: Sequelize.UUID,
                allowNull: false,
                references: {
                    model: 'books',
                    key: 'id'
                },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE'
            },
            price: {
                type: Sequelize.DECIMAL(10, 2),
                allowNull: false
            },
            copies: {
                type: Sequelize.INTEGER,
                allowNull: false,
                defaultValue: 0
            },
            sold_out: {
                type: Sequelize.BOOLEAN,
                allowNull: false,
                defaultValue: false
            },
            createdAt: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
            },
            updatedAt: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
            }
        });

        await queryInterface.addIndex('store_books', ['store_id']);
        await queryInterface.addIndex('store_books', ['book_id']);
        await queryInterface.addIndex('store_books', ['store_id', 'book_id'], {
            unique: true,
            name: 'unique_store_book'
        });
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable('store_books');
    }
};

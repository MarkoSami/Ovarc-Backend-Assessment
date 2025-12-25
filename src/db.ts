// db.ts
import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
    throw new Error('DATABASE_URL environment variable is not defined');
}

export const sequelize = new Sequelize(databaseUrl, {
    logging: false,
    dialect: 'postgres',
});

// Test connection
export const connectDB = async () => {
    try {
        await sequelize.authenticate();
        console.log('✅ Database connected successfully');

        // Sync models in development
        if (process.env.NODE_ENV !== 'production') {
            await sequelize.sync({ alter: true });
            console.log('✅ Database models synchronized');
        }
    } catch (err) {
        console.error('❌ Database connection failed:', err);
        process.exit(1);
    }
};

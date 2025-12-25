import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { connectDB } from "./db";
import { sequelize } from './db';
import "./models"; // Import models to initialize associations

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
    res.json({ message: "Welcome to Express TypeScript API" });
});

app.get("/health", async (req, res) => {
    // trivial database check can be added here
    await sequelize.query('SELECT 1');
    res.json({ status: "ok" });
});

// Initialize database connection before starting server
const startServer = async () => {
    await connectDB();

    app.listen(PORT, () => {
        console.log(`🚀 Server is running on Port: ${PORT}`);
    });
};

startServer();

export default app;

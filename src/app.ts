import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import dotenv from "dotenv";
import { connectDB } from "./db";
import { sequelize } from './db';
import "./models"; // Import models to initialize associations
import inventoryRoutes from "./routes/inventoryRoutes";
import storeRoutes from "./routes/storeRoutes";
import { requestLogger, errorHandler, notFoundHandler } from "./middleware";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Request logger (should be first middleware)
app.use(requestLogger);

app.use(cors());
app.use(express.json());

// Routes
app.use("/api/inventory", inventoryRoutes);
app.use("/api/store", storeRoutes);

app.get("/", (req, res) => {
    res.json({
        success: true,
        message: "Welcome to Express TypeScript API",
        timestamp: new Date().toISOString()
    });
});

app.get("/health", async (req, res) => {
    // trivial database check can be added here
    await sequelize.query('SELECT 1');
    res.json({
        success: true,
        message: "Service is healthy",
        data: { status: "ok" },
        timestamp: new Date().toISOString()
    });
});

// 404 handler for undefined routes
app.use(notFoundHandler);

// Global error handler (should be last middleware)
app.use(errorHandler);

// Initialize database connection before starting server
const startServer = async () => {
    await connectDB();

    app.listen(PORT, () => {
        console.log(`🚀 Server is running on Port: ${PORT}`);
    });
};

startServer();

export default app;

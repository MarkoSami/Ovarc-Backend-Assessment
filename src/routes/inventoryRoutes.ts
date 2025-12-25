import { Router } from 'express';
import multer from 'multer';
import { uploadInventory } from '../controllers/inventoryController';
import { asyncHandler } from '../middleware';

const router = Router();

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({
    storage,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
    },
    fileFilter: (req, file, cb) => {
        // Accept CSV files
        const allowedMimeTypes = ['text/csv', 'application/vnd.ms-excel', 'text/plain'];
        if (allowedMimeTypes.includes(file.mimetype) || file.originalname.toLowerCase().endsWith('.csv')) {
            cb(null, true);
        } else {
            cb(new Error('Only CSV files are allowed'));
        }
    },
});

// POST /api/inventory/upload
router.post('/upload', upload.single('file'), asyncHandler(uploadInventory));

export default router;

import { Router } from 'express';
import { downloadStoreReport, getAllStores } from '../controllers/storeController';
import { asyncHandler } from '../middleware';

const router = Router();

// GET /api/store - Get all stores
router.get('/', asyncHandler(getAllStores));

// GET /api/store/:id/download-report
router.get('/:id/download-report', asyncHandler(downloadStoreReport));

export default router;

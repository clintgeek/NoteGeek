import express from 'express';
import {
    createFolder,
    getFolders,
    updateFolder,
    deleteFolder,
    // getFolderById // Maybe add later if needed, less common for folders
} from '../controllers/folders.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Apply protect middleware to all folder routes
router.use(protect);

// Define routes
router.route('/').post(createFolder).get(getFolders); // Create Folder, Get All Folders
router.route('/:id').put(updateFolder).delete(deleteFolder); // Update Folder, Delete Folder

export default router;
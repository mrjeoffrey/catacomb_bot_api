import express from 'express';
import {
    registerAdmin,
    loginAdmin,
    blockUser,
    editTask,
    updateSettings,
    insertLevel,
    updateLevel,
} from '../controllers/adminController';

const router = express.Router();

router.post('/register', registerAdmin);
router.post('/login', loginAdmin);
router.post('/block-user', blockUser);
router.put('/edit-task', editTask);
router.put('/update-settings', updateSettings);
router.post('/insert-level', insertLevel);
router.put('/update-level', updateLevel);

export default router;

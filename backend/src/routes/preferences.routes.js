import { Router } from 'express';
import {
    getNotificationPreferences,
    updateNotificationPreferences
} from '../controllers/preferences.controller.js';
import { verifyJWT } from '../middleware/auth.middleware.js';

const router = Router();
router.use(verifyJWT);

router.get('/notifications', getNotificationPreferences);
router.put('/notifications', updateNotificationPreferences);

export default router;

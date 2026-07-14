import { Router } from 'express';
import { createSupportRequest } from '../controllers/support.controller.js';
import { verifyJWT } from '../middleware/auth.middleware.js';

const router = Router();

router.use(verifyJWT);

router.post('/', createSupportRequest);

export default router;

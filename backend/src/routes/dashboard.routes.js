import { Router } from 'express';
import { verifyJWT } from '../middleware/auth.middleware.js';
import {
  getAdminDashboard,
  getProjectManagerDashboard,
  getDeveloperDashboard,
  getClientDashboard,
} from '../controllers/dashboard.controller.js';

const router = Router();

router.use(verifyJWT);

router.get('/admin', getAdminDashboard);
router.get('/project-manager', getProjectManagerDashboard);
router.get('/developer', getDeveloperDashboard);
router.get('/client', getClientDashboard);

export default router;

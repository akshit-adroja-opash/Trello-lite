import { Router } from 'express';
import { verifyJWT } from '../middleware/auth.middleware.js';
import { requireGlobalRole } from '../middleware/role.middleware.js';
import {
  getAdminDashboard,
  getProjectManagerDashboard,
  getDeveloperDashboard,
  getClientDashboard,
} from '../controllers/dashboard.controller.js';

const router = Router();

router.use(verifyJWT);

router.get('/admin', requireGlobalRole('admin'), getAdminDashboard);
router.get('/project-manager', requireGlobalRole('project_manager', 'admin'), getProjectManagerDashboard);
router.get('/developer', requireGlobalRole('developer', 'admin'), getDeveloperDashboard);
router.get('/client', requireGlobalRole('client', 'admin'), getClientDashboard);

export default router;

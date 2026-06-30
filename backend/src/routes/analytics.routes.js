import { Router } from "express";
import { getWorkspaceAnalytics } from "../controllers/analyticsController.js";
import { verifyJWT } from "../middleware/auth.middleware.js";
import { requireWorkspaceRole } from "../middleware/role.middleware.js";

const router = Router();

router.use(verifyJWT);

router.get("/workspace/:workspaceId", requireWorkspaceRole('admin', 'project_manager'), getWorkspaceAnalytics);

export default router;
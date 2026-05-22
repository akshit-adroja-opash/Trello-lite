import { Router } from "express";
import { getWorkspaceAnalytics } from "../controllers/analyticsController.js";
import { verifyJWT } from "../middleware/auth.middleware.js";

const router = Router();

router.use(verifyJWT);

router.get("/workspace/:workspaceId", getWorkspaceAnalytics);

export default router;
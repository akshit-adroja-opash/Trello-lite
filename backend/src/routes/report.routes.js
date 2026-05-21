import express from "express";

import {
  generateFullReport,
  generateClientReport,
  shareReportLink,
  downloadSharedReport,
} from "../controllers/reportController.js";

import {
  canGenerateFullReport,
  canGenerateClientReport,
} from "../middleware/reportPermission.js";

import { verifyJWT } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post(
  "/full/:boardId",
  verifyJWT,
  canGenerateFullReport,
  generateFullReport,
);

router.post(
  "/client/:boardId",
  verifyJWT,
  canGenerateClientReport,
  generateClientReport,
);

router.post(
  "/share/:reportId",
  verifyJWT,
  canGenerateFullReport,
  shareReportLink,
);

router.get("/shared/:token", downloadSharedReport);

export default router;

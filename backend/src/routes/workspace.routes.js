import { Router } from 'express';
import { createWorkspace, deleteWorkspace, getMembers, getWorkspaces, inviteMember, removeMember, updateMemberRole, updateWorkspace, getOverdueCount } from '../controllers/workspace.controller.js';
import { verifyJWT } from '../middleware/auth.middleware.js';
import { requireGlobalRole, requireWorkspaceRole } from '../middleware/role.middleware.js';

const router = Router();

router.use(verifyJWT);

router.post('/', requireGlobalRole('admin', 'project_manager'), createWorkspace);
router.get('/', getWorkspaces);
router.post('/:workspaceId/invite', requireWorkspaceRole('admin', 'project_manager'), inviteMember);
router.get('/:workspaceId/members', requireWorkspaceRole(), getMembers);
router.patch('/:workspaceId/members/:memberId', requireWorkspaceRole('admin', 'project_manager'), updateMemberRole);
router.delete('/:workspaceId/members/:memberId', requireWorkspaceRole('admin'), removeMember);
router.patch('/:workspaceId', requireWorkspaceRole('admin'), updateWorkspace);
router.delete('/:workspaceId', requireWorkspaceRole('admin'), deleteWorkspace);
router.get('/:workspaceId/overdue-count', requireWorkspaceRole(), getOverdueCount);


export default router;

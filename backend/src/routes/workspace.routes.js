import { Router } from 'express';
import { createWorkspace, deleteWorkspace, getMembers, getWorkspaces, inviteMember, removeMember, updateMemberRole, updateWorkspace, getOverdueCount } from '../controllers/workspace.controller.js';
import { verifyJWT } from '../middleware/auth.middleware.js';

const router = Router();

router.use(verifyJWT);

router.post('/', createWorkspace);
router.get('/', getWorkspaces);
router.post('/:workspaceId/invite', inviteMember);
router.get('/:workspaceId/members', getMembers);
router.patch('/:workspaceId/members/:memberId', updateMemberRole);
router.delete('/:workspaceId/members/:memberId', removeMember);
router.patch('/:workspaceId', updateWorkspace);
router.delete('/:workspaceId', deleteWorkspace);
router.get('/:workspaceId/overdue-count', getOverdueCount);


export default router;

import { Router } from 'express';
import { createBoard, deleteBoard, addBoardMember, toggleStarBoard, getBoardMembers, getBoards, getSingleBoard, updateBoard, updateBoardMemberRole, removeBoardMember } from '../controllers/board.controller.js';
import { verifyJWT } from '../middleware/auth.middleware.js';
import { requireBoardRole, requireWorkspaceRole } from '../middleware/role.middleware.js';

const router = Router();
router.use(verifyJWT);

router.post('/', createBoard);
router.get('/workspace/:workspaceId', requireWorkspaceRole(), getBoards);
router.get('/:boardId', requireBoardRole(), getSingleBoard);
router.patch('/:boardId', requireBoardRole('admin', 'project_manager'), updateBoard);
router.delete('/:boardId', requireBoardRole('admin', 'project_manager'), deleteBoard);

router.get('/:boardId/members', requireBoardRole(), getBoardMembers);
router.post('/:boardId/members', requireBoardRole('admin'), addBoardMember);
router.patch('/:boardId/members/:memberId', requireBoardRole('admin'), updateBoardMemberRole);
router.delete('/:boardId/members/:memberId', requireBoardRole('admin'), removeBoardMember);

router.patch('/:boardId/star', requireBoardRole('admin', 'project_manager', 'developer', 'client'), toggleStarBoard);

export default router;

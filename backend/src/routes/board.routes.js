import { Router } from 'express';
import { createBoard, deleteBoard, addBoardMember, toggleStarBoard, getBoardMembers, getBoards, getSingleBoard, updateBoard, updateBoardMemberRole, removeBoardMember } from '../controllers/board.controller.js';
import { verifyJWT } from '../middleware/auth.middleware.js';
import { requireBoardRole } from '../middleware/role.middleware.js';

const router = Router();
router.use(verifyJWT);

router.post('/', createBoard);
router.get('/workspace/:workspaceId', getBoards);
router.get('/:boardId', getSingleBoard);
router.patch('/:boardId', requireBoardRole('admin'), updateBoard);
router.delete('/:boardId', requireBoardRole('admin'), deleteBoard);

router.get('/:boardId/members', getBoardMembers);
router.post('/:boardId/members', requireBoardRole('admin'), addBoardMember);
router.patch('/:boardId/members/:memberId', requireBoardRole('admin'), updateBoardMemberRole);
router.delete('/:boardId/members/:memberId', requireBoardRole('admin'), removeBoardMember);

router.patch('/:boardId/star', requireBoardRole('admin', 'project_manager', 'developer', 'client'), toggleStarBoard);

export default router;

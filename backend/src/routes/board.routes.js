import { Router } from 'express';
import { createBoard, deleteBoard, addBoardMember, getBoardMembers, getBoards, getSingleBoard, updateBoard, updateBoardMemberRole } from '../controllers/board.controller.js';
import { verifyJWT } from '../middleware/auth.middleware.js';
import { requireBoardRole } from '../middleware/role.middleware.js';

const router = Router();
router.use(verifyJWT);

router.post('/', createBoard);
router.get('/workspace/:workspaceId', getBoards);
router.get('/:boardId', getSingleBoard);
router.patch('/:boardId', requireBoardRole('Owner'), updateBoard);
router.delete('/:boardId', requireBoardRole('Owner'), deleteBoard);

router.get('/:boardId/members', getBoardMembers);
router.post('/:boardId/members', requireBoardRole('Owner'), addBoardMember);
router.patch('/:boardId/members/:memberId', requireBoardRole('Owner'), updateBoardMemberRole);

export default router;

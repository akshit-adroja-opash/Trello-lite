import { Router } from 'express';
import { createBoard, deleteBoard, getBoardMembers, getBoards, getSingleBoard, updateBoard, updateBoardMemberRole } from '../controllers/board.controller.js';
import { verifyJWT } from '../middleware/auth.middleware.js';

const router = Router();

router.use(verifyJWT);

router.post('/',verifyJWT, createBoard);
router.get('/workspace/:workspaceId', getBoards);
router.get('/:boardId', getSingleBoard);
router.patch('/:boardId', updateBoard);
router.delete('/:boardId', deleteBoard);

router.get('/:boardId/members', getBoardMembers);
router.patch('/:boardId/members/:memberId', updateBoardMemberRole);


export default router;

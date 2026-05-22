import { Router } from 'express';
import { verifyJWT } from '../middleware/auth.middleware.js';
import { requireBoardRole } from '../middleware/role.middleware.js';
import { createCard, deleteCard, getCards, getSingleCard, moveCard, updateCard, getCardActivities, getMyTasks, addComment, saveCardAsTemplate, getBoardTemplates, toggleCommentReaction } from '../controllers/card.controller.js';

const router = Router();
router.use(verifyJWT);


router.post('/', requireBoardRole('Owner', 'Admin'), createCard);
router.get('/column/:columnId', getCards);
router.get('/my-tasks', getMyTasks);
router.get('/:cardId', getSingleCard);
router.get('/:cardId/activities', getCardActivities);
router.post('/:cardId/comments', requireBoardRole('Owner', 'Admin', 'Editor'), addComment);
router.post('/:cardId/comments/:commentId/react', requireBoardRole('Owner', 'Admin', 'Editor'), toggleCommentReaction);
router.post('/:cardId/save-template', requireBoardRole('Owner', 'Admin', 'Editor'), saveCardAsTemplate);
router.get('/board/:boardId/templates', getBoardTemplates);
router.patch('/:cardId', requireBoardRole('Owner', 'Admin'), updateCard);
router.delete('/:cardId', requireBoardRole('Owner', 'Admin'), deleteCard);
router.patch('/:cardId/move', requireBoardRole('Owner', 'Admin', 'Editor'), moveCard);

export default router;

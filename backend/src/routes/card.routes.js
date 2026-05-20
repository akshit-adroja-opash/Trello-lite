import { Router } from 'express';
import { createCard, deleteCard, getCards, getSingleCard, moveCard, updateCard, getCardActivities } from '../controllers/card.controller.js';
import { verifyJWT } from '../middleware/auth.middleware.js';
import { requireBoardRole } from '../middleware/role.middleware.js';

const router = Router();
router.use(verifyJWT);

router.post('/', requireBoardRole('Owner', 'Admin', 'Editor'), createCard);
router.get('/column/:columnId', getCards);
router.get('/:cardId', getSingleCard);
router.get('/:cardId/activities', getCardActivities);
router.patch('/:cardId', requireBoardRole('Owner', 'Admin', 'Editor'), updateCard);
router.delete('/:cardId', requireBoardRole('Owner', 'Admin', 'Editor'), deleteCard);
router.patch('/:cardId/move', requireBoardRole('Owner', 'Admin', 'Editor'), moveCard);

export default router;

import { Router } from 'express';
import { createCard, deleteCard, getCards, getSingleCard, moveCard, updateCard, getCardActivities } from '../controllers/card.controller.js';
import { verifyJWT } from '../middleware/auth.middleware.js';
import { requireBoardRole } from '../middleware/role.middleware.js';

const router = Router();
router.use(verifyJWT);

router.post('/', requireBoardRole('Owner', 'Editor'), createCard);
router.get('/column/:columnId', getCards);
router.get('/:cardId', getSingleCard);
router.get('/:cardId/activities', getCardActivities);
router.patch('/:cardId', requireBoardRole('Owner', 'Editor'), updateCard);
router.delete('/:cardId', requireBoardRole('Owner', 'Editor'), deleteCard);
router.patch('/:cardId/move', requireBoardRole('Owner', 'Editor'), moveCard);

export default router;

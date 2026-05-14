import { Router } from 'express';
import { createCard, deleteCard, getCards, getSingleCard, moveCard, updateCard } from '../controllers/card.controller.js';
import { verifyJWT } from '../middleware/auth.middleware.js';

const router = Router();

router.use(verifyJWT);

router.post('/', createCard);
router.get('/column/:columnId', getCards);
router.patch('/:cardId', updateCard);
router.get('/:cardId', getSingleCard);
router.delete('/:cardId', deleteCard);
router.patch('/:cardId/move', moveCard);


export default router;

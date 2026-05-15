import { Router } from 'express';
import { createColumn, deleteColumn, getColumns, reorderColumn, updateColumn } from '../controllers/column.controller.js';
import { verifyJWT } from '../middleware/auth.middleware.js';

const router = Router();
router.use(verifyJWT);

router.post('/', createColumn);
router.get('/board/:boardId', getColumns);
router.patch('/reorder', reorderColumn);
router.patch('/:columnId', updateColumn);
router.delete('/:columnId', deleteColumn);

export default router;

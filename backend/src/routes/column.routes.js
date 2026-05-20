import { Router } from 'express';
import { createColumn, deleteColumn, getColumns, reorderColumn, updateColumn } from '../controllers/column.controller.js';
import { verifyJWT } from '../middleware/auth.middleware.js';
import { requireBoardRole } from '../middleware/role.middleware.js';

const router = Router();
router.use(verifyJWT);

router.post('/', requireBoardRole('Owner', 'Admin', 'Editor'), createColumn);
router.get('/board/:boardId', getColumns);
router.patch('/reorder', requireBoardRole('Owner', 'Admin'), reorderColumn);
router.patch('/:columnId', requireBoardRole('Owner', 'Admin'), updateColumn);
router.delete('/:columnId', requireBoardRole('Owner', 'Admin'), deleteColumn);

export default router;

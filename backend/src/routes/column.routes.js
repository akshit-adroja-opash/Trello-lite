import { Router } from 'express';
import { createColumn, deleteColumn, getColumns, reorderColumn, updateColumn } from '../controllers/column.controller.js';
import { verifyJWT } from '../middleware/auth.middleware.js';
import { requireBoardRole } from '../middleware/role.middleware.js';

const router = Router();
router.use(verifyJWT);

router.post('/', requireBoardRole('admin', 'project_manager'), createColumn);
router.get('/board/:boardId', getColumns);
router.patch('/reorder', requireBoardRole('admin', 'project_manager'), reorderColumn);
router.patch('/:columnId', requireBoardRole('admin', 'project_manager'), updateColumn);
router.delete('/:columnId', requireBoardRole('admin', 'project_manager'), deleteColumn);

export default router;

import { Router } from 'express';
import { verifyJWT } from '../middleware/auth.middleware.js';
import { requireBoardRole } from '../middleware/role.middleware.js';
import { cardAttachmentUpload } from '../middleware/upload.middleware.js';
import { 
  createCard, 
  deleteCard, 
  getCards, 
  getSingleCard, 
  moveCard, 
  updateCard, 
  getCardActivities, 
  getMyTasks, 
  addComment, 
  saveCardAsTemplate, 
  getBoardTemplates, 
  toggleCommentReaction,
  addCardAttachment,
  deleteCardAttachment
} from '../controllers/card.controller.js';

const router = Router();
router.use(verifyJWT);


router.post('/', requireBoardRole('admin', 'project_manager'), createCard);
router.get('/column/:columnId', getCards);
router.get('/my-tasks', getMyTasks);
router.get('/:cardId', getSingleCard);
router.get('/:cardId/activities', getCardActivities);
router.post('/:cardId/comments', requireBoardRole('admin', 'project_manager', 'developer'), addComment);
router.post('/:cardId/comments/:commentId/react', requireBoardRole('admin', 'project_manager', 'developer'), toggleCommentReaction);
router.post('/:cardId/save-template', requireBoardRole('admin', 'project_manager', 'developer'), saveCardAsTemplate);
router.get('/board/:boardId/templates', getBoardTemplates);
router.patch('/:cardId', requireBoardRole('admin', 'project_manager', 'developer'), updateCard);
router.delete('/:cardId', requireBoardRole('admin', 'project_manager'), deleteCard);
router.patch('/:cardId/move', requireBoardRole('admin', 'project_manager', 'developer'), moveCard);

// Card Attachments routes
router.post('/:cardId/attachments', requireBoardRole('admin', 'project_manager', 'developer'), cardAttachmentUpload.single('file'), addCardAttachment);
router.delete('/:cardId/attachments/:attachmentId', requireBoardRole('admin', 'project_manager', 'developer'), deleteCardAttachment);

export default router;

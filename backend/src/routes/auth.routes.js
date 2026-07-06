import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { 
  register, 
  login, 
  getMe, 
  logout, 
  updateProfile, 
  getDevelopers, 
  deleteAccount, 
  getAllUsers, 
  updateUserRole, 
  deleteUser,
  get2FAStatus,
  toggle2FA,
  getSessions,
  revokeSession,
  createUserByAdmin
} from '../controllers/auth.controller.js';
import { verifyJWT } from '../middleware/auth.middleware.js';
import { requireGlobalRole } from '../middleware/role.middleware.js';
import { avatarUpload } from '../middleware/upload.middleware.js';

const router = Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 requests per window
  message: { status: 'error', message: 'Too many attempts, please try again later.' }
});

router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);
router.get('/me', verifyJWT, getMe);
router.post('/logout', logout);
router.patch('/profile', verifyJWT, avatarUpload.single('avatar'), updateProfile);
router.get('/developers', verifyJWT, requireGlobalRole('admin', 'project_manager'), getDevelopers);
router.delete('/account', verifyJWT, deleteAccount);

// 2FA routes
router.get('/2fa', verifyJWT, get2FAStatus);
router.post('/2fa', verifyJWT, toggle2FA);

// Session routes
router.get('/sessions', verifyJWT, getSessions);
router.delete('/sessions/:id', verifyJWT, revokeSession);

// Admin User Management routes
router.get('/users', verifyJWT, requireGlobalRole('admin'), getAllUsers);
router.post('/users', verifyJWT, requireGlobalRole('admin'), createUserByAdmin);
router.patch('/users/:id/role', verifyJWT, requireGlobalRole('admin'), updateUserRole);
router.delete('/users/:id', verifyJWT, requireGlobalRole('admin'), deleteUser);

export default router;

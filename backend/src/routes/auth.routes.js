import { Router } from 'express';
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
  revokeSession
} from '../controllers/auth.controller.js';
import { verifyJWT } from '../middleware/auth.middleware.js';
import { avatarUpload } from '../middleware/upload.middleware.js';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', verifyJWT, getMe);
router.post('/logout', logout);
router.patch('/profile', verifyJWT, avatarUpload.single('avatar'), updateProfile);
router.get('/developers', verifyJWT, getDevelopers);
router.delete('/account', verifyJWT, deleteAccount);

// 2FA routes
router.get('/2fa', verifyJWT, get2FAStatus);
router.post('/2fa', verifyJWT, toggle2FA);

// Session routes
router.get('/sessions', verifyJWT, getSessions);
router.delete('/sessions/:id', verifyJWT, revokeSession);

// Admin User Management routes
router.get('/users', verifyJWT, getAllUsers);
router.patch('/users/:id/role', verifyJWT, updateUserRole);
router.delete('/users/:id', verifyJWT, deleteUser);

export default router;

import express from 'express';
import { redirectToGoogle, handleGoogleCallback, logout, getUserProfile } from '../controllers/auth.controller.js';
import { protect } from '../middlewares/authjwt.js';

const router = express.Router();

router.get('/google', redirectToGoogle);
router.get('/google/callback', handleGoogleCallback);
router.post('/logout', protect, logout);
router.get('/profile', protect, getUserProfile);

router.get('/frontend-protect', protect, (req, res) => {
  res.status(200).json({
    user: {
      name: req.user.name,
      email: req.user.email,
      gmailConnected: !!(req.user.accessToken && req.user.refreshToken)
    }
  });
});



export default router;

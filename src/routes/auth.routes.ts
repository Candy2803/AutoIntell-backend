import express from 'express';
import { signUp, signin, signout } from '#controllers/auth.controller.ts';
import { authenticateJWT } from '#middleware/auth.middleware.ts';

const router = express.Router();

router.post('/sign-up', signUp);
router.post('/sign-in', signin);
router.post('/sign-out', signout);

// Get current user info
router.get('/me', authenticateJWT, (req, res) => {
  res.json({
    success: true,
    user: req.user,
  });
});

export default router;

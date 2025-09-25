import express from 'express';
import { db, auth } from '../lib/firebase-admin';
import { authenticateToken, requireAdmin } from '../lib/auth';

const router = express.Router();

// Get current user profile
router.get('/profile', authenticateToken, async (req, res) => {
    try {
        const userDoc = await db.collection('users').doc(req.user!.uid).get();

        if (!userDoc.exists) {
            return res.status(404).json({ error: 'User profile not found' });
        }

        const userData = userDoc.data();
        res.json({
            uid: req.user!.uid,
            email: req.user!.email,
            ...userData
        });
    } catch (error) {
        console.error('Error fetching user profile:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Update user profile
router.put('/profile', authenticateToken, async (req, res) => {
    try {
        const { name } = req.body;

        if (!name || typeof name !== 'string') {
            return res.status(400).json({ error: 'Name is required and must be a string' });
        }

        await db.collection('users').doc(req.user!.uid).update({
            name: name.trim(),
            updatedAt: new Date().toISOString()
        });

        res.json({ message: 'Profile updated successfully' });
    } catch (error) {
        console.error('Error updating user profile:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Admin route: Get all users
router.get('/all', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const usersSnapshot = await db.collection('users').get();
        const users = usersSnapshot.docs.map(doc => ({
            uid: doc.id,
            ...doc.data()
        }));

        res.json(users);
    } catch (error) {
        console.error('Error fetching all users:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Admin route: Update user role
router.put('/:uid/role', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { uid } = req.params;
        const { role } = req.body;

        if (!role || !['user', 'admin'].includes(role)) {
            return res.status(400).json({ error: 'Valid role is required (user or admin)' });
        }

        // Update in Firestore
        await db.collection('users').doc(uid).update({
            role,
            updatedAt: new Date().toISOString()
        });

        // Set custom claims for Firebase Auth
        await auth.setCustomUserClaims(uid, { role });

        res.json({ message: 'User role updated successfully' });
    } catch (error) {
        console.error('Error updating user role:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Delete user account (admin only)
router.delete('/:uid', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { uid } = req.params;

        // Delete from Firebase Auth
        await auth.deleteUser(uid);

        // Delete from Firestore
        await db.collection('users').doc(uid).delete();

        res.json({ message: 'User account deleted successfully' });
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
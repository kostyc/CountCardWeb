import { Router } from 'express';
import type { UserRole, OrganizationalAssignment } from '@countcard/core/types/auth';
import { adminDb, adminAuth } from '../admin';
import { verifyAuthToken, isAdmin } from '../auth';

const router = Router();

const VALID_ROLES: UserRole[] = [
  'drill_instructor',
  'senior_drill_instructor',
  'chief_drill_instructor',
  'company_first_sgt',
  'series_commander',
  'company_xo',
  'company_commander',
  'battalion_sgt_maj',
  'battalion_xo',
  'battalion_commander',
];

router.post('/profile', async (req, res) => {
  try {
    const token = await verifyAuthToken(req);
    if (!token) {
      res.status(401).json({ error: 'Unauthorized - valid authentication token required' });
      return;
    }
    const profileData = req.body;
    const profileRef = adminDb.collection('userProfiles').doc(token.uid);
    await profileRef.set({ ...profileData, userId: token.uid, updatedAt: new Date() }, { merge: true });
    res.json({ success: true, message: 'Profile saved successfully' });
  } catch {
    res.status(500).json({ error: 'Failed to save profile' });
  }
});

router.get('/profile/completion', async (req, res) => {
  try {
    const token = await verifyAuthToken(req);
    if (!token) {
      res.status(401).json({ error: 'Unauthorized - valid authentication token required' });
      return;
    }
    const snap = await adminDb.collection('userProfiles').doc(token.uid).get();
    const data = snap.data() ?? {};
    const required = ['firstName', 'lastName', 'rank', 'role'];
    const completed = required.filter((f) => Boolean(data[f])).length;
    res.json({ success: true, completionPercentage: Math.round((completed / required.length) * 100), profile: data });
  } catch {
    res.status(500).json({ error: 'Failed to get profile completion' });
  }
});

router.post('/profile/completion', async (req, res) => {
  try {
    const token = await verifyAuthToken(req);
    if (!token) {
      res.status(401).json({ error: 'Unauthorized - valid authentication token required' });
      return;
    }
    const { completionPercentage } = req.body ?? {};
    if (typeof completionPercentage !== 'number') {
      res.status(400).json({ error: 'completionPercentage is required' });
      return;
    }
    await adminDb.collection('userProfiles').doc(token.uid).set(
      { profileCompletion: completionPercentage, updatedAt: new Date() },
      { merge: true }
    );
    res.json({ success: true, completionPercentage });
  } catch {
    res.status(500).json({ error: 'Failed to update profile completion' });
  }
});

router.post('/accept-policies', async (req, res) => {
  try {
    const token = await verifyAuthToken(req);
    if (!token) {
      res.status(401).json({ error: 'Unauthorized - valid authentication token required' });
      return;
    }
    const { privacyPolicyAccepted, termsOfServiceAccepted } = req.body ?? {};
    await adminDb.collection('userProfiles').doc(token.uid).set(
      {
        privacyPolicyAccepted: Boolean(privacyPolicyAccepted),
        termsOfServiceAccepted: Boolean(termsOfServiceAccepted),
        policiesAcceptedAt: new Date(),
        updatedAt: new Date(),
      },
      { merge: true }
    );
    res.json({ success: true, message: 'Policy acceptance recorded' });
  } catch {
    res.status(500).json({ error: 'Failed to record policy acceptance' });
  }
});

router.post('/set-custom-claims', async (req, res) => {
  try {
    const token = await verifyAuthToken(req);
    if (!token) {
      res.status(401).json({ error: 'Unauthorized - valid authentication token required' });
      return;
    }

    const { userId, role, organizationalAssignment } = req.body ?? {};
    if (!userId) {
      res.status(400).json({ error: 'User ID is required' });
      return;
    }

    const userIsAdmin = await isAdmin(token.uid);
    if (userId !== token.uid && !userIsAdmin) {
      res.status(403).json({ error: 'Forbidden - you can only update your own custom claims or must be an admin' });
      return;
    }

    if (role && !VALID_ROLES.includes(role as UserRole)) {
      res.status(400).json({ error: 'Invalid role' });
      return;
    }

    if (
      organizationalAssignment?.regiment &&
      !['West', 'East'].includes(organizationalAssignment.regiment)
    ) {
      res.status(400).json({ error: 'Invalid regiment. Must be "West" or "East"' });
      return;
    }

    const user = await adminAuth.getUser(userId);
    const currentClaims = user.customClaims || {};
    const newClaims: Record<string, unknown> = { ...currentClaims };

    if (role !== undefined) newClaims.role = role;
    if (organizationalAssignment !== undefined) {
      newClaims.organizationalAssignment = organizationalAssignment as OrganizationalAssignment;
    }

    await adminAuth.setCustomUserClaims(userId, newClaims);
    res.json({ success: true, message: 'Custom claims updated successfully', claims: newClaims });
  } catch {
    res.status(500).json({ error: 'Failed to set custom claims' });
  }
});

export default router;

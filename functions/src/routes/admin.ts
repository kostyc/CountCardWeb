import { Router } from 'express';
import { adminDb } from '../admin';
import { verifyAuthToken, isAdmin } from '../auth';

const router = Router();

router.get('/users', async (req, res) => {
  try {
    const token = await verifyAuthToken(req);
    if (!token) {
      res.status(401).json({ error: 'Unauthorized - valid authentication token required' });
      return;
    }
    if (!(await isAdmin(token.uid))) {
      res.status(403).json({ error: 'Forbidden - admin access required' });
      return;
    }
    const searchQuery = (req.query.search as string) || '';
    const limit = parseInt((req.query.limit as string) || '50', 10);
    const snapshot = await adminDb.collection('userProfiles').limit(limit).get();
    type UserRow = { id: string; displayName?: string; email?: string };
    let users: UserRow[] = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...(doc.data() as Omit<UserRow, 'id'>),
    }));
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      users = users.filter(
        (u) =>
          String(u.displayName ?? '').toLowerCase().includes(q) ||
          String(u.email ?? '').toLowerCase().includes(q)
      );
    }
    res.json({ success: true, users });
  } catch {
    res.status(500).json({ error: 'Failed to list users' });
  }
});

export default router;

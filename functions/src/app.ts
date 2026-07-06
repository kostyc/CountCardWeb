import express from 'express';
import cors from 'cors';
import { initFirebaseClient } from './firebaseClient';
import encryptionRoutes from './routes/encryption';
import userRoutes from './routes/user';
import countCardRoutes from './routes/countCards';
import adminRoutes from './routes/admin';
import recruitRoutes from './routes/recruits';
import transferBatchRoutes from './routes/transferBatches';
import diLeadershipCardRoutes from './routes/diLeadershipCards';
import conversationRoutes from './routes/conversations';
import recruitImportRoutes from './routes/recruitImport';

let apiApp: express.Application | undefined;

export function createApiApp(): express.Application {
  if (apiApp) return apiApp;

  initFirebaseClient();

  const app = express();
  const allowedOrigins = (process.env.ALLOWED_ORIGINS || '').split(',').map((o) => o.trim()).filter(Boolean);

  app.use(
    cors({
      origin: allowedOrigins.length ? allowedOrigins : true,
      credentials: true,
    })
  );
  app.use(express.json());

  const mountApi = (base: express.Router) => {
    base.use('/encryption', encryptionRoutes);
    base.use('/user', userRoutes);
    base.use('/count-cards', countCardRoutes);
    base.use('/admin', adminRoutes);
    base.use('/recruits', recruitImportRoutes);
    base.use('/recruits', recruitRoutes);
    base.use('/transfer-batches', transferBatchRoutes);
    base.use('/di-leadership-cards', diLeadershipCardRoutes);
    base.use('/conversations', conversationRoutes);
  };

  const apiRouter = express.Router();
  mountApi(apiRouter);
  app.use('/api', apiRouter);

  // Legacy direct Cloud Run paths (health probes, pre-/api clients)
  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', service: 'countcard-api' });
  });
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', service: 'countcard-api' });
  });
  mountApi(app);

  apiApp = app;
  return app;
}

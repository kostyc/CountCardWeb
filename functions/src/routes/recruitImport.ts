import { Router } from 'express';
import multer from 'multer';
import { z } from 'zod';
import {
  parseRecruitImportSheet,
  type RecruitImportOrgDefaults,
} from '@countcard/core/import/recruitExcelImport';
import {
  delimitedTextToSheetRows,
  extractPlatoonFromText,
  normalizeRecruitImportSheetRows,
} from '@countcard/core/import/recruitTextTable';
import { hasPermission } from '@countcard/core/permissions/roles';
import type { RecruitRank } from '@countcard/core/constants/recruitRanks';
import { verifyAuthToken, isAdmin } from '../auth';
import { extractRecruitTableFromDocumentImage } from '../lib/import/documentVision';
import {
  DEFAULT_RECRUIT_RANK,
  MAX_IMPORT_FILE_BYTES,
  readRecruitImportBuffer,
} from '../lib/import/recruitImportBuffer';

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_IMPORT_FILE_BYTES },
});

const ALLOWED_IMAGE_MIMES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'] as const;

const orgDefaultsSchema = z.object({
  regiment: z.string().optional(),
  battalion: z.string().optional(),
  company: z.string().optional(),
  series: z.string().optional(),
  platoon: z.string().optional(),
});

function userCanImportRecruits(token: NonNullable<Awaited<ReturnType<typeof verifyAuthToken>>>): boolean {
  if (token.role && hasPermission(token.role, 'edit_own_platoon')) return true;
  if (token.role && hasPermission(token.role, 'edit_series')) return true;
  if (token.role && hasPermission(token.role, 'edit_company')) return true;
  if (token.role && hasPermission(token.role, 'edit_battalion')) return true;
  return false;
}

function parseOrgDefaults(raw: unknown): RecruitImportOrgDefaults {
  if (typeof raw !== 'string' || !raw.trim()) return {};
  const parsed = orgDefaultsSchema.safeParse(JSON.parse(raw));
  return parsed.success ? parsed.data : {};
}

function toArrayBuffer(buf: Buffer): ArrayBuffer {
  return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) as ArrayBuffer;
}

router.post('/import/parse-image', upload.single('file'), async (req, res) => {
  try {
    const token = await verifyAuthToken(req);
    if (!token) {
      res.status(401).json({ error: 'Unauthorized - valid authentication token required' });
      return;
    }

    const userIsAdmin = await isAdmin(token.uid);
    if (!userIsAdmin && !userCanImportRecruits(token)) {
      res.status(403).json({ error: 'Forbidden - insufficient permissions' });
      return;
    }

    const file = req.file;
    if (!file) {
      res.status(400).json({ error: 'Missing image file' });
      return;
    }

    const mimeType = file.mimetype === 'image/jpg' ? 'image/jpeg' : file.mimetype;
    if (!ALLOWED_IMAGE_MIMES.includes(mimeType as (typeof ALLOWED_IMAGE_MIMES)[number])) {
      res.status(400).json({ error: 'Supported image formats: JPG, PNG, or WebP' });
      return;
    }

    const orgDefaults = parseOrgDefaults(req.body?.orgDefaults);
    const defaultRank = (req.body?.defaultRank as RecruitRank | undefined) ?? DEFAULT_RECRUIT_RANK;
    const buffer = toArrayBuffer(file.buffer);

    const { text, provider } = await extractRecruitTableFromDocumentImage(buffer, mimeType);
    const platoonHint = extractPlatoonFromText(text);
    const mergedDefaults: RecruitImportOrgDefaults = {
      ...orgDefaults,
      platoon: orgDefaults.platoon ?? platoonHint,
    };

    const sheetRows = normalizeRecruitImportSheetRows(delimitedTextToSheetRows(text));
    const result = parseRecruitImportSheet(sheetRows, mergedDefaults, { defaultRank });

    if (result.rows.length === 0 && result.errors.length === 0) {
      res.status(422).json({
        ...result,
        provider,
        platoonHint,
        error: 'Could not detect a recruit roster table in the image. Try a clearer photo or use .xlsx/.pdf.',
      });
      return;
    }

    res.json({
      ...result,
      provider,
      platoonHint,
      fileKind: 'image' as const,
    });
  } catch (err) {
    const message =
      err instanceof Error && err.message.includes('not configured')
        ? 'Document photo import is not configured on this server'
        : 'Failed to parse roster image';
    res.status(500).json({ error: message });
  }
});

router.post('/import/parse-document', upload.single('file'), async (req, res) => {
  try {
    const token = await verifyAuthToken(req);
    if (!token) {
      res.status(401).json({ error: 'Unauthorized - valid authentication token required' });
      return;
    }

    const userIsAdmin = await isAdmin(token.uid);
    if (!userIsAdmin && !userCanImportRecruits(token)) {
      res.status(403).json({ error: 'Forbidden - insufficient permissions' });
      return;
    }

    const file = req.file;
    if (!file) {
      res.status(400).json({ error: 'Missing roster file' });
      return;
    }

    const orgDefaults = parseOrgDefaults(req.body?.orgDefaults);
    const defaultRank = (req.body?.defaultRank as RecruitRank | undefined) ?? DEFAULT_RECRUIT_RANK;
    const buffer = toArrayBuffer(file.buffer);

    const result = await readRecruitImportBuffer(buffer, file.originalname, file.mimetype, orgDefaults, {
      defaultRank,
    });

    if (result.rows.length === 0 && result.errors.length > 0) {
      res.status(422).json({
        ...result,
        platoonHint: result.platoonHint,
        error: result.errors[0]?.message ?? 'Could not parse roster file',
      });
      return;
    }

    res.json(result);
  } catch {
    res.status(500).json({ error: 'Failed to parse roster file' });
  }
});

export default router;

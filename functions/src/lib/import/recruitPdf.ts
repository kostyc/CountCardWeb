/**
 * Extract tabular rows from PDF files for recruit import.
 * Uses pdfjs-dist in the browser with position-based column reconstruction.
 */

import {
  delimitedTextToSheetRows,
  normalizeRecruitImportSheetRows,
  extractPlatoonFromText,
} from '@countcard/core/import/recruitTextTable';

const LINE_Y_TOLERANCE = 4;
const COLUMN_X_GAP = 24;

interface PositionedText {
  str: string;
  x: number;
  y: number;
}

type PdfTextItem = {
  str?: string;
  transform?: number[];
};

function clusterLineIntoColumns(items: PositionedText[]): string[] {
  if (!items.length) return [];

  const sorted = [...items].sort((a, b) => a.x - b.x);
  const columns: string[] = [];
  let current = sorted[0].str;
  let lastX = sorted[0].x;

  for (let i = 1; i < sorted.length; i += 1) {
    const item = sorted[i];
    if (item.x - lastX > COLUMN_X_GAP) {
      columns.push(current.trim());
      current = item.str;
    } else {
      current = `${current} ${item.str}`.trim();
    }
    lastX = item.x;
  }

  columns.push(current.trim());
  return columns.filter(Boolean);
}

function groupTextItemsIntoRows(items: PdfTextItem[]): string[][] {
  const positioned: PositionedText[] = items
    .filter((item): item is PdfTextItem & { str: string; transform: number[] } => {
      return typeof item.str === 'string' && item.str.trim().length > 0 && Array.isArray(item.transform);
    })
    .map((item) => ({
      str: item.str.trim(),
      x: item.transform[4] ?? 0,
      y: item.transform[5] ?? 0,
    }));

  const lineBuckets = new Map<number, PositionedText[]>();
  for (const item of positioned) {
    const yKey = Math.round(item.y / LINE_Y_TOLERANCE) * LINE_Y_TOLERANCE;
    const bucket = lineBuckets.get(yKey) ?? [];
    bucket.push(item);
    lineBuckets.set(yKey, bucket);
  }

  return [...lineBuckets.entries()]
    .sort((a, b) => b[0] - a[0])
    .map(([, lineItems]) => clusterLineIntoColumns(lineItems))
    .filter((row) => row.some((cell) => cell.length > 0));
}

async function loadPdfJs() {
  const pdfjs = await import('pdfjs-dist');
  if (!pdfjs.GlobalWorkerOptions.workerSrc) {
    pdfjs.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
  }
  return pdfjs;
}

export interface RecruitPdfExtractResult {
  sheetRows: unknown[][];
  platoonHint?: string;
}

export async function extractSheetRowsFromPdf(buffer: ArrayBuffer): Promise<RecruitPdfExtractResult> {
  const pdfjs = await loadPdfJs();
  const pdf = await pdfjs.getDocument({ data: new Uint8Array(buffer) }).promise;

  const positionedRows: string[][] = [];
  let fallbackText = '';

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum += 1) {
    const page = await pdf.getPage(pageNum);
    const textContent = await page.getTextContent();
    const items = textContent.items as PdfTextItem[];

    const pageRows = groupTextItemsIntoRows(items);
    if (pageRows.length >= 2) {
      positionedRows.push(...pageRows);
    }

    const pageText = items
      .map((item) => ('str' in item && item.str ? item.str : ''))
      .filter(Boolean)
      .join(' ');
    fallbackText += `${pageText}\n`;
  }

  await pdf.destroy();

  let sheetRows: unknown[][];
  if (positionedRows.length >= 2) {
    sheetRows = positionedRows;
  } else {
    sheetRows = delimitedTextToSheetRows(fallbackText);
  }

  sheetRows = normalizeRecruitImportSheetRows(sheetRows);
  const platoonHint = extractPlatoonFromText(fallbackText);

  return { sheetRows, platoonHint };
}

/**
 * Server-side document image extraction for recruit roster import.
 * Primary: Google Gemini. Fallback: xAI (Grok).
 */


const GEMINI_MODEL = 'gemini-2.0-flash';
const XAI_VISION_MODEL = 'grok-2-vision-1212';
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

export type DocumentVisionProvider = 'gemini' | 'xai';

const RECRUIT_TABLE_EXTRACTION_PROMPT = `Extract the recruit roster table from this document photo.

Return ONLY tab-separated text (TSV) with exactly this header row:
Recruit Name\tEDIPI / SSN\tMOS Prog\tIST Pull-ups\tIST Plank\tIST 1.5mi\tGT Score\tMedical / Admin Flags\tWeapons Serial\tRCO Serial

Then one data row per recruit. Use empty cells if a value is missing.
No markdown, no code fences, no explanation.`;

function stripModelMarkdown(text: string): string {
  return text
    .replace(/^```(?:\w+)?\s*\n?/gm, '')
    .replace(/\n?```\s*$/gm, '')
    .trim();
}

function bufferToBase64(buffer: ArrayBuffer): string {
  return Buffer.from(buffer).toString('base64');
}

function normalizeMimeType(mimeType: string): string {
  return mimeType === 'image/jpg' ? 'image/jpeg' : mimeType;
}

async function extractWithGemini(
  buffer: ArrayBuffer,
  mimeType: string,
  apiKey: string
): Promise<string> {
  const normalizedMime = normalizeMimeType(mimeType);
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${encodeURIComponent(apiKey)}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            { text: RECRUIT_TABLE_EXTRACTION_PROMPT },
            {
              inline_data: {
                mime_type: normalizedMime,
                data: bufferToBase64(buffer),
              },
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.1,
        maxOutputTokens: 8192,
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`Gemini request failed (${response.status})`);
  }

  const payload = (await response.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };
  const text = payload.candidates?.[0]?.content?.parts?.map((part) => part.text ?? '').join('') ?? '';
  const cleaned = stripModelMarkdown(text);
  if (!cleaned) {
    throw new Error('Gemini returned empty extraction');
  }
  return cleaned;
}

async function extractWithXai(
  buffer: ArrayBuffer,
  mimeType: string,
  apiKey: string
): Promise<string> {
  const normalizedMime = normalizeMimeType(mimeType);
  if (normalizedMime === 'image/webp') {
    throw new Error('xAI vision supports JPG and PNG only');
  }

  const dataUrl = `data:${normalizedMime};base64,${bufferToBase64(buffer)}`;
  const response = await fetch('https://api.x.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: XAI_VISION_MODEL,
      temperature: 0.1,
      max_tokens: 8192,
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: RECRUIT_TABLE_EXTRACTION_PROMPT },
            {
              type: 'image_url',
              image_url: { url: dataUrl, detail: 'high' },
            },
          ],
        },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(`xAI request failed (${response.status})`);
  }

  const payload = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const text = payload.choices?.[0]?.message?.content ?? '';
  const cleaned = stripModelMarkdown(text);
  if (!cleaned) {
    throw new Error('xAI returned empty extraction');
  }
  return cleaned;
}

export interface DocumentVisionExtractionResult {
  text: string;
  provider: DocumentVisionProvider;
}

/**
 * Extract roster table text from a document photo.
 * Tries Gemini first, then xAI if Gemini fails or is not configured.
 */
export async function extractRecruitTableFromDocumentImage(
  buffer: ArrayBuffer,
  mimeType: string
): Promise<DocumentVisionExtractionResult> {
  if (buffer.byteLength > MAX_IMAGE_BYTES) {
    throw new Error('Image exceeds 5 MB limit');
  }

  const geminiKey = process.env.GEMINI_API_KEY?.trim();
  const xaiKey = process.env.XAI_API_KEY?.trim();

  if (!geminiKey && !xaiKey) {
    throw new Error('Document image extraction is not configured');
  }

  if (geminiKey) {
    try {
      const text = await extractWithGemini(buffer, mimeType, geminiKey);
      return { text, provider: 'gemini' };
    } catch {
      if (!xaiKey) {
        throw new Error('Could not extract roster from image. Try a clearer photo or use .xlsx/.pdf.');
      }
    }
  }

  const text = await extractWithXai(buffer, mimeType, xaiKey!);
  return { text, provider: 'xai' };
}

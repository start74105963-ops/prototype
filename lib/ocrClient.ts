import type { JackpotEntry } from '@/types';

let _cnt = 0;
const genId = () => `ocr${++_cnt}`;

// "16R" → 16、"16" → 16、null → null
function parseRound(v: unknown): number | null {
  if (v == null) return null;
  const n = parseInt(String(v));
  return isNaN(n) ? null : n;
}

export async function ocrJackpotImage(
  imageDataUrl: string,
  onProgress?: (pct: number, status: string) => void
): Promise<JackpotEntry[]> {
  onProgress?.(10, '画像を準備中...');

  const match = imageDataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) throw new Error('画像データの形式が不正です');

  const mediaType = match[1] as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp';
  const imageBase64 = match[2];

  onProgress?.(30, 'AIで読み取り中...');

  const response = await fetch('/api/ocr-jackpot', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ imageBase64, mediaType }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error ?? 'OCR APIエラー');
  }

  const data = await response.json();
  onProgress?.(100, '完了');

  return (data.entries ?? []).map((e: Record<string, unknown>) => ({
    id: genId(),
    normalStart: e.normalStart != null ? parseInt(String(e.normalStart)) : null,
    output: e.output != null ? parseInt(String(e.output)) : null,
    round: parseRound(e.round),
    jitan: e.jitan != null ? parseInt(String(e.jitan)) : null,
  }));
}

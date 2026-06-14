import { createWorker } from 'tesseract.js';
import type { JackpotEntry } from '@/types';

let _cnt = 0;
const genId = () => `ocr${++_cnt}`;

// JPEG圧縮ノイズを考慮した赤判定
function isRed(r: number, g: number, b: number) {
  return r > 140 && g < 120 && b < 120 && r > g + 60 && r > b + 60;
}

function sampleColor(
  imageData: ImageData,
  x0: number, y0: number, x1: number, y1: number
): 'red' | 'dark' {
  const { data, width, height } = imageData;
  let red = 0, dark = 0;
  for (let y = Math.floor(y0); y <= Math.min(height - 1, Math.ceil(y1)); y += 2) {
    for (let x = Math.floor(x0); x <= Math.min(width - 1, Math.ceil(x1)); x += 2) {
      const i = (y * width + x) * 4;
      const [r, g, b] = [data[i], data[i + 1], data[i + 2]];
      if (isRed(r, g, b)) red++;
      else if (r < 80 && g < 80 && b < 80) dark++;
    }
  }
  return red > dark ? 'red' : 'dark';
}

type TWord = { text: string; confidence: number; bbox: { x0: number; y0: number; x1: number; y1: number } };

function clusterByY(words: TWord[], threshold: number): TWord[][] {
  const clusters: TWord[][] = [];
  for (const w of words) {
    const mid = (w.bbox.y0 + w.bbox.y1) / 2;
    const found = clusters.find(c => {
      const cm = (c[0].bbox.y0 + c[0].bbox.y1) / 2;
      return Math.abs(cm - mid) < threshold;
    });
    found ? found.push(w) : clusters.push([w]);
  }
  return clusters.sort((a, b) => a[0].bbox.y0 - b[0].bbox.y0);
}

export async function ocrJackpotImage(
  imageUrl: string,
  onProgress?: (pct: number, status: string) => void
): Promise<JackpotEntry[]> {
  // キャンバスに描画して色情報を取得
  const img = new Image();
  await new Promise<void>((res, rej) => {
    img.onload = () => res();
    img.onerror = rej;
    img.src = imageUrl;
  });

  const canvas = document.createElement('canvas');
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(img, 0, 0);
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

  onProgress?.(3, 'OCRエンジン読み込み中...');

  const worker = await createWorker('eng', 1, {
    logger: m => {
      if (m.status === 'loading tesseract core') {
        onProgress?.(5, 'OCRエンジン読み込み中...');
      } else if (m.status === 'loading language traineddata') {
        onProgress?.(15, '言語モデル読み込み中...');
      } else if (m.status === 'recognizing text') {
        onProgress?.(20 + Math.round(m.progress * 70), `解析中 ${Math.round(m.progress * 100)}%`);
      }
    },
  });

  const { data } = await worker.recognize(canvas);
  await worker.terminate();

  onProgress?.(92, '結果を解析中...');

  // blocks→paragraphs→lines→words を平坦化
  const allWords: TWord[] = [];
  for (const block of data.blocks ?? []) {
    for (const para of block.paragraphs ?? []) {
      for (const line of para.lines ?? []) {
        for (const word of line.words ?? []) {
          allWords.push(word as TWord);
        }
      }
    }
  }

  // 数字・コロンを含む語だけ残す
  const meaningful = allWords.filter(
    w => w.confidence > 25 && /[\d:]/.test(w.text)
  );

  const clusters = clusterByY(meaningful, 20);
  const entries: JackpotEntry[] = [];

  for (const cluster of clusters) {
    cluster.sort((a, b) => a.bbox.x0 - b.bbox.x0);

    // 時刻パターン（HH:MM）がある行のみ有効なデータ行とみなす
    const timeWord = cluster.find(w => /^\d{1,2}:\d{2}$/.test(w.text.trim()));
    if (!timeWord) continue;

    // 純粋な数値語（時刻を除く）
    const nums = cluster
      .filter(w => /^\d+$/.test(w.text.trim()))
      .map(w => ({ n: parseInt(w.text), bbox: w.bbox }))
      .filter(({ n }) => n > 0 && n <= 9999);

    if (nums.length === 0) continue;

    // 最右の数字 = スタート列
    const startItem = nums[nums.length - 1];
    // 最左の小さい数字 = 回数列
    const roundItem = nums.length > 1 && nums[0].n <= 50 ? nums[0] : null;

    // スタート位置のピクセル色で赤/黒を判定
    const { x0, y0, x1, y1 } = startItem.bbox;
    const color = sampleColor(imageData, x0, y0, x1, y1);

    entries.push({
      id: genId(),
      round: roundItem?.n ?? null,
      time: timeWord.text.trim(),
      start: startItem.n,
      isChance: color === 'red',
    });
  }

  entries.sort((a, b) => (a.round ?? 999) - (b.round ?? 999));
  onProgress?.(100, '完了');
  return entries;
}

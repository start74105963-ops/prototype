'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import DraggableLine from './DraggableLine';
import InputFields from './InputFields';
import ResultPanel from './ResultPanel';
import { calcResult } from '@/lib/calc';
import type { CalcResult } from '@/types';

const TAMA_PER_YEN = 4;

export default function GraphAnalyzer() {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [wrapHeight, setWrapHeight] = useState(0);
  const [zeroTop, setZeroTop] = useState(0);
  const [calibTop, setCalibTop] = useState(0);
  const [measureTop, setMeasureTop] = useState(0);
  const [mochiTop, setMochiTop] = useState(0);
  const [totalStart, setTotalStart] = useState<number | null>(null);
  const [border, setBorder] = useState<number | null>(null);
  const [result, setResult] = useState<CalcResult | null>(null);

  const wrapRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const recalc = useCallback((
    z: number, c: number, m: number, mo: number,
    ts: number | null, b: number | null
  ) => {
    const r = calcResult({
      zeroTop: z, calibTop: c, measureTop: m, mochiTop: mo,
      totalStart: ts, border: b, tamaPerYen: TAMA_PER_YEN,
    });
    setResult(r);
  }, []);

  const handleImage = (file: File) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.getElementById('graphCanvas') as HTMLCanvasElement;
      canvas.width = img.width;
      canvas.height = img.height;
      canvas.getContext('2d')!.drawImage(img, 0, 0);
      setImageUrl(img.src);
      setTimeout(() => {
        const h = wrapRef.current?.offsetHeight ?? 400;
        setWrapHeight(h);
        const z = h * 0.35;
        const c = h * 0.48;
        const m = h * 0.65;
        const mo = h * 0.55;
        setZeroTop(z);
        setCalibTop(c);
        setMeasureTop(m);
        setMochiTop(mo);
        recalc(z, c, m, mo, totalStart, border);
      }, 150);
    };
    img.src = URL.createObjectURL(file);
  };

  // ラインが動くたびに再計算
  useEffect(() => {
    if (!imageUrl) return;
    recalc(zeroTop, calibTop, measureTop, mochiTop, totalStart, border);
  }, [zeroTop, calibTop, measureTop, mochiTop, totalStart, border, imageUrl, recalc]);

  // ウィンドウリサイズでwrapHeightを更新
  useEffect(() => {
    const onResize = () => {
      if (wrapRef.current && imageUrl) {
        setWrapHeight(wrapRef.current.offsetHeight);
      }
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [imageUrl]);

  const toushiLabel = result?.toushiTama != null
    ? `投資 ${result.toushiTama.toLocaleString()}`
    : '投資(最低点)';
  const mochiLabel = result?.mochiTama != null
    ? `持ち玉 ${result.mochiTama.toLocaleString()}`
    : '持ち玉';

  return (
    <div className="max-w-[580px] mx-auto px-4 py-4">
      {/* アップロードゾーン */}
      {!imageUrl && (
        <div className="mb-5">
          <div
            className="border-[1.5px] border-dashed border-[#2e333d] rounded-[14px] p-8 text-center cursor-pointer bg-[#1a1d24]"
            onClick={() => fileRef.current?.click()}
            onDragOver={e => e.preventDefault()}
            onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleImage(f); }}
          >
            <p className="text-sm font-medium mb-1">グラフ画像をアップロード</p>
            <p className="text-xs text-[#9aa0aa]">4本のラインで投資と持ち玉を測定します</p>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={e => { const f = e.target.files?.[0]; if (f) handleImage(f); }}
            />
          </div>
        </div>
      )}

      {/* Canvas + ドラッグライン */}
      <div
        ref={wrapRef}
        className="relative rounded-[10px] overflow-hidden border border-[#2e333d] touch-none"
        style={{ display: imageUrl ? 'block' : 'none', marginBottom: imageUrl ? '12px' : 0 }}
      >
        <canvas id="graphCanvas" className="w-full block" />
        {imageUrl && wrapHeight > 0 && (
          <>
            <DraggableLine top={zeroTop} color="#22aa77" label="±0" wrapHeight={wrapHeight} onTopChange={v => setZeroTop(v)} />
            <DraggableLine top={calibTop} color="#3b82f6" label="-10,000" wrapHeight={wrapHeight} onTopChange={v => setCalibTop(v)} />
            <DraggableLine top={measureTop} color="#e24b4a" label={toushiLabel} wrapHeight={wrapHeight} onTopChange={v => setMeasureTop(v)} />
            <DraggableLine top={mochiTop} color="#f59e0b" label={mochiLabel} wrapHeight={wrapHeight} onTopChange={v => setMochiTop(v)} />
          </>
        )}
      </div>

      {/* 入力・結果 */}
      {imageUrl && (
        <div>
          {/* 凡例 */}
          <div className="bg-[#1a1d24] rounded-[14px] p-4 mb-4">
            <p className="text-[13px] font-medium mb-2">4本のラインを合わせてください</p>
            <div className="flex flex-wrap gap-y-1">
              {[
                { color: '#22aa77', text: '±0（黒の太線）' },
                { color: '#3b82f6', text: '-10,000（点線）' },
                { color: '#e24b4a', text: '投資（最低点）' },
                { color: '#f59e0b', text: '持ち玉（現在地点）' },
              ].map(({ color, text }) => (
                <span key={text} className="inline-flex items-center gap-1 text-xs text-[#9aa0aa] mr-3 mb-1">
                  <span className="inline-block w-4 h-[3px] rounded" style={{ backgroundColor: color }} />
                  {text}
                </span>
              ))}
            </div>
          </div>

          <InputFields
            totalStart={totalStart}
            border={border}
            onTotalStartChange={v => setTotalStart(v)}
            onBorderChange={v => setBorder(v)}
          />

          <ResultPanel result={result} totalStart={totalStart} border={border} />
        </div>
      )}
    </div>
  );
}

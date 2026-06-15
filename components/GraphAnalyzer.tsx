'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import DraggableLine from './DraggableLine';
import { calcResult } from '@/lib/calc';
import type { CalcResult } from '@/types';

const TAMA_PER_YEN = 4;

interface Props {
  onResult?: (result: CalcResult | null) => void;
}

export default function GraphAnalyzer({ onResult }: Props) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [lineMode, setLineMode] = useState(false);
  const [wrapHeight, setWrapHeight] = useState(0);
  const [zeroTop, setZeroTop] = useState(0);
  const [calibTop, setCalibTop] = useState(0);
  const [measureTop, setMeasureTop] = useState(0);
  const [mochiTop, setMochiTop] = useState(0);
  const [mochiLabel, setMochiLabel] = useState('持ち玉（最終地点）');
  const [toushiLabel, setToushiLabel] = useState('投資（最低点）');

  const lineFracs = useRef<{ z: number; c: number; m: number; mo: number } | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const canvasWrapRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const recalc = useCallback((z: number, c: number, m: number, mo: number) => {
    const r = calcResult({
      zeroTop: z, calibTop: c, measureTop: m, mochiTop: mo,
      totalStart: null, border: null, tamaPerYen: TAMA_PER_YEN,
    });
    onResult?.(r);

    const mochi = r.mochiTama;
    const toushi = r.toushiTama;
    setMochiLabel(mochi != null
      ? `持ち玉 ${mochi >= 0 ? '+' : ''}${mochi.toLocaleString()}`
      : '持ち玉（最終地点）');
    setToushiLabel(toushi != null
      ? `投資 ${Math.abs(toushi).toLocaleString()}`
      : '投資（最低点）');
  }, [onResult]);

  // iOS対応: FileReader → 即ラインモード
  const handleImage = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      setImageUrl(e.target?.result as string);
      lineFracs.current = null;
      onResult?.(null);
      setLineMode(true);
    };
    reader.readAsDataURL(file);
  };

  // ラインモードが開いたらキャンバスを描画
  useEffect(() => {
    if (!lineMode || !imageUrl) return;
    const timer = setTimeout(() => {
      const canvas = canvasRef.current;
      const wrap = canvasWrapRef.current;
      if (!canvas || !wrap) return;
      const img = new Image();
      img.onload = () => {
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        canvas.getContext('2d')!.drawImage(img, 0, 0);
        const containerW = wrap.clientWidth;
        const h = Math.round((img.naturalHeight / img.naturalWidth) * containerW);
        setWrapHeight(h);
        if (lineFracs.current) {
          const { z, c, m, mo } = lineFracs.current;
          const nz = z * h, nc = c * h, nm = m * h, nmo = mo * h;
          setZeroTop(nz); setCalibTop(nc); setMeasureTop(nm); setMochiTop(nmo);
          recalc(nz, nc, nm, nmo);
        } else {
          const z = h * 0.35, c = h * 0.48, m = h * 0.65, mo = h * 0.55;
          setZeroTop(z); setCalibTop(c); setMeasureTop(m); setMochiTop(mo);
          recalc(z, c, m, mo);
        }
      };
      img.src = imageUrl;
    }, 80);
    return () => clearTimeout(timer);
  }, [lineMode, imageUrl, recalc]);

  // ライン変更時に再計算
  useEffect(() => {
    if (!imageUrl || !lineMode) return;
    recalc(zeroTop, calibTop, measureTop, mochiTop);
  }, [zeroTop, calibTop, measureTop, mochiTop, imageUrl, lineMode, recalc]);

  const closeLineMode = () => {
    if (wrapHeight > 0) {
      lineFracs.current = {
        z: zeroTop / wrapHeight, c: calibTop / wrapHeight,
        m: measureTop / wrapHeight, mo: mochiTop / wrapHeight,
      };
    }
    setLineMode(false);
  };

  const resetImage = () => {
    setImageUrl(null);
    lineFracs.current = null;
    setLineMode(false);
    onResult?.(null);
    if (fileRef.current) fileRef.current.value = '';
  };

  return (
    <div className="max-w-[580px] mx-auto px-4 py-2">
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={e => { const f = e.target.files?.[0]; if (f) handleImage(f); }}
      />

      {/* アップロードゾーン */}
      {!imageUrl && (
        <div
          className="border-[1.5px] border-dashed border-[#DDDDE3] rounded-[20px] p-10 text-center cursor-pointer bg-white hover:bg-[#FAFAFA] transition-colors"
          onClick={() => fileRef.current?.click()}
          onDragOver={e => e.preventDefault()}
          onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleImage(f); }}
        >
          <div className="w-10 h-10 mx-auto mb-3 rounded-xl bg-[#F5F5F7] flex items-center justify-center">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M10 3v10M6 7l4-4 4 4" stroke="#86868b" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M3 14v1a2 2 0 002 2h10a2 2 0 002-2v-1" stroke="#86868b" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </div>
          <p className="text-[14px] font-semibold text-[#1D1D1F] mb-1">グラフ画像をアップロード</p>
          <p className="text-[12px] text-[#86868b]">4本のラインで投資と持ち玉を測定します</p>
        </div>
      )}

      {/* 通常ビュー */}
      {imageUrl && !lineMode && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-[13px] font-medium text-[#1D1D1F]">グラフ画像</p>
            <button
              onClick={resetImage}
              className="flex items-center gap-1.5 bg-[#9562E3] hover:bg-[#8452D3] text-white text-[12px] font-semibold px-3 py-1.5 rounded-lg transition-colors"
            >
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                <path d="M1 6.5a5.5 5.5 0 1010.9-.8" stroke="white" strokeWidth="1.4" strokeLinecap="round"/>
                <path d="M11.5 2.5v3h-3" stroke="white" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              別の画像に変更
            </button>
          </div>
          <div
            className="relative rounded-[16px] overflow-hidden border border-[#E8E8EC] cursor-pointer"
            onClick={() => setLineMode(true)}
          >
            <img src={imageUrl} alt="グラフ" className="w-full block" />
            <div className="absolute inset-0 bg-black/25 flex items-center justify-center">
              <span className="bg-white/95 text-[#1D1D1F] text-[14px] font-semibold px-6 py-2.5 rounded-full shadow-md">
                タップしてラインを調整
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 全画面ラインモード */}
      {lineMode && (
        <div className="fixed inset-0 z-50 bg-white flex flex-col">
          <div className="h-14 flex items-center justify-between px-4 border-b border-[#E8E8EC] shrink-0">
            <div>
              <p className="text-[15px] font-bold text-[#1D1D1F]">ラインを調整</p>
              <p className="text-[11px] text-[#86868b]">ドラッグして各ラインを合わせてください</p>
            </div>
            <button
              onClick={closeLineMode}
              className="bg-[#9562E3] hover:bg-[#8452D3] text-white px-5 py-2 rounded-full text-[14px] font-semibold transition-colors"
            >
              完了
            </button>
          </div>

          {/* 凡例バー */}
          <div className="px-4 py-2.5 border-b border-[#F0F0F5] flex flex-wrap gap-x-4 gap-y-1 shrink-0 bg-[#FAFAFA]">
            {[
              { color: '#22aa77', text: '±0（黒の太線）' },
              { color: '#0071e3', text: '-10,000（点線）' },
              { color: '#e24b4a', text: '投資（最低点）' },
              { color: '#f59e0b', text: '持ち玉（グラフの最終地点に合わせる）' },
            ].map(({ color, text }) => (
              <span key={text} className="inline-flex items-center gap-1.5 text-[11px] text-[#86868b]">
                <span className="inline-block w-4 h-[3px] rounded-full" style={{ backgroundColor: color }} />
                {text}
              </span>
            ))}
          </div>

          {/* キャンバスエリア */}
          <div className="flex-1 overflow-y-auto">
            <div ref={canvasWrapRef} className="relative">
              <canvas ref={canvasRef} className="w-full block" />
              {wrapHeight > 0 && (
                <>
                  <DraggableLine top={zeroTop} color="#22aa77" label="±0" wrapHeight={wrapHeight} onTopChange={v => setZeroTop(v)} />
                  <DraggableLine top={calibTop} color="#0071e3" label="-10,000" wrapHeight={wrapHeight} onTopChange={v => setCalibTop(v)} />
                  <DraggableLine top={measureTop} color="#e24b4a" label={toushiLabel} wrapHeight={wrapHeight} onTopChange={v => setMeasureTop(v)} />
                  <DraggableLine top={mochiTop} color="#f59e0b" label={mochiLabel} wrapHeight={wrapHeight} onTopChange={v => setMochiTop(v)} />
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

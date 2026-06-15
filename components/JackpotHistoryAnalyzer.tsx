'use client';

import { useState, useRef } from 'react';
import type { JackpotEntry, CalcResult } from '@/types';
import { ocrJackpotImage } from '@/lib/ocrClient';

let idCounter = 0;
function genId() { return `j${++idCounter}`; }
function makeRow(): JackpotEntry {
  return { id: genId(), normalStart: null, output: null, round: null, jitan: null };
}
const INIT_ROWS = 5;

interface Props {
  graphResult?: CalcResult | null;
}

export default function JackpotHistoryAnalyzer({ graphResult }: Props) {
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);
  const [showImageFull, setShowImageFull] = useState(false);
  const [entries, setEntries] = useState<JackpotEntry[]>(
    Array.from({ length: INIT_ROWS }, makeRow)
  );
  const [progress, setProgress] = useState(0);
  const [progressLabel, setProgressLabel] = useState('');
  const [loading, setLoading] = useState(false);
  const [ocrError, setOcrError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // iOS対応: FileReader で data URL 化
  const handleFile = (file: File) => {
    setOcrError(null);
    const reader = new FileReader();
    reader.onload = (e) => setImageDataUrl(e.target?.result as string);
    reader.readAsDataURL(file);
  };

  const runOcr = async () => {
    if (!imageDataUrl) return;
    setLoading(true);
    setOcrError(null);
    setProgress(0);
    setProgressLabel('準備中...');
    try {
      const result = await ocrJackpotImage(imageDataUrl, (pct, status) => {
        setProgress(pct);
        setProgressLabel(status);
      });
      if (result.length > 0) {
        // 読み取り結果が5行未満でも最低5行表示を維持
        const padded = result.length < INIT_ROWS
          ? [...result, ...Array.from({ length: INIT_ROWS - result.length }, makeRow)]
          : result;
        setEntries(padded);
      } else {
        setOcrError('行が読み取れませんでした。手動で入力してください。');
      }
    } catch (e) {
      console.error(e);
      setOcrError('読み取りに失敗しました。手動で入力してください。');
    } finally {
      setLoading(false);
      setProgress(0);
      setProgressLabel('');
    }
  };

  const update = (id: string, patch: Partial<JackpotEntry>) =>
    setEntries(prev => prev.map(e => e.id === id ? { ...e, ...patch } : e));
  const addRow = () => setEntries(prev => [...prev, makeRow()]);
  const removeRow = (id: string) => setEntries(prev => prev.filter(e => e.id !== id));

  // ── 集計 ──
  const filledStart = entries.filter(e => e.normalStart != null);
  const totalNormalStart = filledStart.reduce((s, e) => s + (e.normalStart ?? 0), 0);
  const totalJitan = entries.reduce((s, e) => s + (e.jitan ?? 0), 0);
  const normalKaiten = totalNormalStart - totalJitan;   // 通常回転数

  const filledOutput = entries.filter(e => e.output != null);
  const totalOutput = filledOutput.reduce((s, e) => s + (e.output ?? 0), 0);

  const filledRound = entries.filter(e => e.round != null && e.output != null);
  const totalRound = filledRound.reduce((s, e) => s + (e.round ?? 0), 0);
  const perRoundOutput = totalRound > 0
    ? Math.round(totalOutput / totalRound)
    : null;

  // 打ち込み = |投資玉| + 出玉 - 持ち玉(オレンジライン)
  const toushiTama = graphResult?.toushiTama ?? null;
  const mochiTama = graphResult?.mochiTama ?? null;
  const uchikomi = (toushiTama != null && mochiTama != null)
    ? Math.abs(toushiTama) + totalOutput - mochiTama
    : null;

  return (
    <div className="max-w-[580px] mx-auto px-4 py-2">

      {/* ── アップロードゾーン（画像未選択時） ── */}
      {!imageDataUrl && (
        <div
          className="border-[1.5px] border-dashed border-[#DDDDE3] rounded-[20px] p-10 text-center cursor-pointer bg-white hover:bg-[#FAFAFA] transition-colors mb-4"
          onClick={() => fileRef.current?.click()}
          onDragOver={e => e.preventDefault()}
          onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
        >
          <div className="w-10 h-10 mx-auto mb-3 rounded-xl bg-[#F5F5F7] flex items-center justify-center">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M10 3v10M6 7l4-4 4 4" stroke="#86868b" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M3 14v1a2 2 0 002 2h10a2 2 0 002-2v-1" stroke="#86868b" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </div>
          <p className="text-[14px] font-semibold text-[#1D1D1F] mb-1">大当り履歴の画像をアップロード</p>
          <p className="text-[12px] text-[#86868b]">AI自動読み取り後に手動修正もできます</p>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
          />
        </div>
      )}

      {/* ── 画像スティッキーヘッダー（画像選択後） ──
           スクロール中も常に画面上部に固定し、手動修正時の参照を可能にする */}
      {imageDataUrl && (
        <div className="sticky top-0 z-30 bg-white border-b border-[#E8E8EC] shadow-sm mb-4 -mx-4 px-4">
          {/* コンパクト画像プレビュー */}
          <div className="relative overflow-hidden" style={{ maxHeight: '140px' }}>
            <img
              src={imageDataUrl}
              alt="大当り履歴"
              className="w-full object-cover object-top"
              style={{ maxHeight: '140px' }}
            />
            {/* グラデーションオーバーレイ */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
            {/* 操作ボタン群 */}
            <div className="absolute bottom-2 left-0 right-0 flex items-center justify-between px-3">
              <button
                onClick={() => { setImageDataUrl(null); setOcrError(null); if (fileRef.current) fileRef.current.value = ''; }}
                className="flex items-center gap-1 bg-[#9562E3] text-white text-[11px] font-semibold px-2.5 py-1 rounded-lg"
              >
                <svg width="11" height="11" viewBox="0 0 13 13" fill="none">
                  <path d="M1 6.5a5.5 5.5 0 1010.9-.8" stroke="white" strokeWidth="1.4" strokeLinecap="round"/>
                  <path d="M11.5 2.5v3h-3" stroke="white" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                別の画像
              </button>
              <button
                onClick={() => setShowImageFull(true)}
                className="bg-white/90 text-[#1D1D1F] text-[11px] font-semibold px-2.5 py-1 rounded-lg"
              >
                全画面で見る
              </button>
            </div>
          </div>

          {/* OCRボタン / プログレス */}
          {loading ? (
            <div className="px-1 py-2.5">
              <div className="flex justify-between text-[11px] mb-1.5">
                <span className="text-[#86868b]">{progressLabel}</span>
                <span className="text-[#9562E3] font-medium">{progress}%</span>
              </div>
              <div className="h-1 bg-[#F5F5F7] rounded-full overflow-hidden">
                <div className="h-full bg-[#9562E3] rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
              </div>
            </div>
          ) : (
            <button
              onClick={runOcr}
              className="w-full py-2.5 text-[13px] font-semibold bg-[#9562E3] hover:bg-[#8452D3] text-white transition-colors"
            >
              画像から自動読み取り
            </button>
          )}

          {ocrError && (
            <p className="text-[11px] text-[#C0392B] px-1 py-1.5">{ocrError}</p>
          )}

          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
          />
        </div>
      )}

      {/* 全画面画像モーダル */}
      {showImageFull && imageDataUrl && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
          onClick={() => setShowImageFull(false)}
        >
          <img
            src={imageDataUrl}
            alt="大当り履歴（全画面）"
            className="max-w-full max-h-full object-contain p-4"
          />
          <button className="absolute top-4 right-4 text-white text-[28px] leading-none font-light">×</button>
        </div>
      )}

      {/* ── 入力テーブル ── */}
      <div className="bg-white rounded-[24px] p-4 mb-4 border border-[#E8E8EC] shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
        <p className="text-[13px] font-semibold text-[#1D1D1F] mb-3">大当り履歴</p>

        <div className="overflow-x-auto -mx-1 px-1">
          <div style={{ minWidth: '340px' }}>
            <div className="grid grid-cols-[72px_64px_52px_64px_28px] gap-1.5 text-[11px] text-[#86868b] font-medium px-1 mb-1.5">
              <span>回転数</span>
              <span>出玉</span>
              <span>ラウンド</span>
              <span>時短(ST)</span>
              <span />
            </div>

            <div className="space-y-1.5">
              {entries.map((entry) => (
                <div key={entry.id} className="grid grid-cols-[72px_64px_52px_64px_28px] gap-1.5 items-center">
                  <input
                    type="number"
                    placeholder="例: 225"
                    value={entry.normalStart ?? ''}
                    onChange={e => update(entry.id, { normalStart: e.target.value ? parseInt(e.target.value) : null })}
                    className="bg-[#F5F5F7] border border-[#E8E8EC] text-[#1D1D1F] rounded-lg px-2 py-1.5 text-[13px] w-full outline-none focus:border-[#9562E3] transition-all placeholder:text-[#C7C7CC]"
                  />
                  <input
                    type="number"
                    placeholder="例: 1500"
                    value={entry.output ?? ''}
                    onChange={e => update(entry.id, { output: e.target.value ? parseInt(e.target.value) : null })}
                    className="bg-[#F5F5F7] border border-[#E8E8EC] text-[#1D1D1F] rounded-lg px-2 py-1.5 text-[13px] w-full outline-none focus:border-[#9562E3] transition-all placeholder:text-[#C7C7CC]"
                  />
                  <input
                    type="number"
                    placeholder="16"
                    value={entry.round ?? ''}
                    onChange={e => update(entry.id, { round: e.target.value ? parseInt(e.target.value) : null })}
                    className="bg-[#F5F5F7] border border-[#E8E8EC] text-[#1D1D1F] rounded-lg px-2 py-1.5 text-[13px] w-full outline-none focus:border-[#9562E3] transition-all placeholder:text-[#C7C7CC]"
                  />
                  <input
                    type="number"
                    placeholder="100"
                    value={entry.jitan ?? ''}
                    onChange={e => update(entry.id, { jitan: e.target.value ? parseInt(e.target.value) : null })}
                    className="bg-[#F5F5F7] border border-[#E8E8EC] text-[#1D1D1F] rounded-lg px-2 py-1.5 text-[13px] w-full outline-none focus:border-[#9562E3] transition-all placeholder:text-[#C7C7CC]"
                  />
                  <button
                    onClick={() => removeRow(entry.id)}
                    className="text-[#C7C7CC] hover:text-[#C0392B] text-[16px] leading-none transition-colors text-center"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        <button
          onClick={addRow}
          className="mt-3 w-full py-2.5 rounded-xl border border-dashed border-[#DDDDE3] text-[13px] text-[#86868b] hover:border-[#9562E3] hover:text-[#9562E3] transition-colors"
        >
          ＋ 行を追加
        </button>
      </div>

      {/* ── 集計結果 ── */}
      <div className="bg-white border border-[#E8E8EC] rounded-[24px] p-5 shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
        <p className="text-[12px] text-[#86868b] font-semibold uppercase tracking-wider mb-3">集計</p>

        <div className="space-y-2.5">
          {/* 通常回転数 */}
          <div className="bg-[#F5F5F7] rounded-2xl px-4 py-3 flex items-center justify-between">
            <div>
              <p className="text-[12px] text-[#0071e3] font-medium">通常回転数</p>
              <p className="text-[11px] text-[#86868b] mt-0.5">回転数の合計 − 時短(ST)の合計</p>
            </div>
            <div className="text-right">
              <p className="text-[24px] font-bold text-[#1D1D1F] leading-none">
                {filledStart.length > 0 ? normalKaiten.toLocaleString() : '—'}
              </p>
              <p className="text-[11px] text-[#86868b] mt-0.5">回転</p>
            </div>
          </div>

          {/* 1ラウンドあたり出玉 */}
          <div className="bg-[#F5F5F7] rounded-2xl px-4 py-3 flex items-center justify-between">
            <div>
              <p className="text-[12px] text-[#86868b] font-medium">1ラウンドあたり出玉</p>
              <p className="text-[11px] text-[#86868b] mt-0.5">出玉の合計 ÷ ラウンドの合計</p>
            </div>
            <div className="text-right">
              <p className="text-[24px] font-bold text-[#1D1D1F] leading-none">
                {perRoundOutput != null ? perRoundOutput.toLocaleString() : '—'}
              </p>
              <p className="text-[11px] text-[#86868b] mt-0.5">玉 / R</p>
            </div>
          </div>

          {/* 打ち込み */}
          <div className="bg-[#F5F5F7] rounded-2xl px-4 py-3 flex items-center justify-between">
            <div>
              <p className="text-[12px] text-[#86868b] font-medium">打ち込み</p>
              <p className="text-[11px] text-[#86868b] mt-0.5">
                {uchikomi != null
                  ? '投資 + 出玉 − 持ち玉（グラフ）'
                  : 'グラフのラインを設定してください'}
              </p>
            </div>
            <div className="text-right">
              <p className="text-[24px] font-bold text-[#1D1D1F] leading-none">
                {uchikomi != null ? uchikomi.toLocaleString() : '—'}
              </p>
              <p className="text-[11px] text-[#86868b] mt-0.5">玉</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

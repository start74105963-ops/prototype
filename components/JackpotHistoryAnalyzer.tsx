'use client';

import { useState, useRef } from 'react';
import type { JackpotEntry } from '@/types';
import { ocrJackpotImage } from '@/lib/ocrClient';

let idCounter = 0;
function genId() { return `j${++idCounter}`; }

function makeRow(round?: number | null, partial?: Partial<JackpotEntry>): JackpotEntry {
  return { id: genId(), round: round ?? null, time: '', start: null, isChance: false, ...partial };
}

function MetricCard({ label, value, unit, color }: { label: string; value: string; unit: string; color?: string }) {
  return (
    <div className="bg-[#1a1d24] rounded-[10px] p-3.5">
      <p className="text-[12px] mb-1" style={{ color: color ?? '#9aa0aa' }}>{label}</p>
      <p className="text-[20px] font-medium text-[#e8eaed]">{value}</p>
      <p className="text-[11px] text-[#9aa0aa] mt-0.5">{unit}</p>
    </div>
  );
}

export default function JackpotHistoryAnalyzer() {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [entries, setEntries] = useState<JackpotEntry[]>([makeRow(1)]);
  const [progress, setProgress] = useState<number>(0);
  const [progressLabel, setProgressLabel] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [ocrError, setOcrError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    setOcrError(null);
    const url = URL.createObjectURL(file);
    setImageUrl(url);
  };

  const runOcr = async () => {
    if (!imageUrl) return;
    setLoading(true);
    setOcrError(null);
    setProgress(0);
    setProgressLabel('準備中...');
    try {
      const result = await ocrJackpotImage(imageUrl, (pct, status) => {
        setProgress(pct);
        setProgressLabel(status);
      });
      if (result.length > 0) {
        setEntries(result);
      } else {
        setOcrError('テーブルの行が読み取れませんでした。手動で入力してください。');
      }
    } catch (e) {
      console.error(e);
      setOcrError('OCR処理中にエラーが発生しました。');
    } finally {
      setLoading(false);
      setProgress(0);
      setProgressLabel('');
    }
  };

  const update = (id: string, patch: Partial<JackpotEntry>) =>
    setEntries(prev => prev.map(e => e.id === id ? { ...e, ...patch } : e));

  const addRow = () =>
    setEntries(prev => [...prev, makeRow(prev.length + 1)]);

  const removeRow = (id: string) =>
    setEntries(prev => prev.filter(e => e.id !== id));

  const filledEntries = entries.filter(e => e.start != null);
  const normalEntries = filledEntries.filter(e => !e.isChance);
  const chanceEntries = filledEntries.filter(e => e.isChance);
  const normalTotal = normalEntries.reduce((s, e) => s + (e.start ?? 0), 0);
  const normalCount = normalEntries.length;
  const chanceCount = chanceEntries.length;
  const totalCount = filledEntries.length;
  const avgNormal = normalCount > 0 ? Math.round(normalTotal / normalCount) : null;
  const maxNormal = normalCount > 0 ? Math.max(...normalEntries.map(e => e.start ?? 0)) : null;
  const minNormal = normalCount > 0 ? Math.min(...normalEntries.map(e => e.start ?? 0)) : null;
  const chanceRate = totalCount > 0 ? Math.round((chanceCount / totalCount) * 100) : null;

  return (
    <div className="max-w-[580px] mx-auto px-4 py-4">
      {/* 画像アップロード */}
      {!imageUrl ? (
        <div
          className="border-[1.5px] border-dashed border-[#2e333d] rounded-[14px] p-8 text-center cursor-pointer bg-[#1a1d24] mb-5"
          onClick={() => fileRef.current?.click()}
          onDragOver={e => e.preventDefault()}
          onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
        >
          <p className="text-sm font-medium mb-1">大当り履歴の画像をアップロード</p>
          <p className="text-xs text-[#9aa0aa]">アップロード後に自動読み取りボタンが表示されます</p>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
          />
        </div>
      ) : (
        <div className="mb-4">
          <div className="relative mb-3">
            <img src={imageUrl} alt="大当り履歴" className="w-full rounded-[10px] border border-[#2e333d]" />
            <button
              className="absolute top-2 right-2 bg-[#232730] border border-[#2e333d] text-[#9aa0aa] text-xs px-2.5 py-1 rounded-lg"
              onClick={() => { setImageUrl(null); setOcrError(null); fileRef.current && (fileRef.current.value = ''); }}
            >
              変更
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
            />
          </div>

          {/* OCRボタン & プログレス */}
          {loading ? (
            <div className="bg-[#1a1d24] rounded-[12px] p-4">
              <div className="flex justify-between text-[12px] mb-2">
                <span className="text-[#9aa0aa]">{progressLabel}</span>
                <span className="text-[#3b82f6]">{progress}%</span>
              </div>
              <div className="h-1.5 bg-[#232730] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#3b82f6] rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          ) : (
            <button
              onClick={runOcr}
              className="w-full py-3 rounded-[12px] text-[14px] font-medium bg-[#3b82f6] hover:bg-[#2563eb] text-white transition-colors"
            >
              画像から自動読み取り
            </button>
          )}

          {ocrError && (
            <p className="text-[12px] text-[#ef4444] mt-2 px-1">{ocrError}</p>
          )}
        </div>
      )}

      {/* 入力テーブル */}
      <div className="bg-[#1a1d24] rounded-[14px] p-4 mb-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-[13px] font-medium">大当り履歴</p>
          <div className="flex gap-3">
            <span className="inline-flex items-center gap-1 text-[11px] text-[#9aa0aa]">
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#22c55e]" />通常
            </span>
            <span className="inline-flex items-center gap-1 text-[11px] text-[#9aa0aa]">
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#ef4444]" />連チャン
            </span>
          </div>
        </div>

        <div className="grid grid-cols-[44px_1fr_88px_32px] gap-2 text-[11px] text-[#9aa0aa] px-1 mb-1.5">
          <span>回数</span>
          <span>スタート数</span>
          <span className="text-center">種別</span>
          <span />
        </div>

        <div className="space-y-2">
          {entries.map((entry) => (
            <div key={entry.id} className="grid grid-cols-[44px_1fr_88px_32px] gap-2 items-center">
              <input
                type="number"
                value={entry.round ?? ''}
                min={1}
                onChange={e => update(entry.id, { round: e.target.value ? parseInt(e.target.value) : null })}
                className="bg-[#232730] border border-[#2e333d] text-[#e8eaed] rounded-lg px-1 py-1.5 text-[14px] w-full outline-none text-center focus:border-[#3b82f6] transition-colors"
              />
              <input
                type="number"
                placeholder="例: 225"
                value={entry.start ?? ''}
                onChange={e => update(entry.id, { start: e.target.value ? parseInt(e.target.value) : null })}
                className="bg-[#232730] border border-[#2e333d] text-[#e8eaed] rounded-lg px-3 py-1.5 text-[14px] w-full outline-none focus:border-[#3b82f6] transition-colors"
              />
              <button
                onClick={() => update(entry.id, { isChance: !entry.isChance })}
                className={`text-[12px] font-medium py-1.5 rounded-lg transition-colors ${
                  entry.isChance
                    ? 'bg-[#3a1a1a] text-[#ef4444] border border-[#5a2a2a]'
                    : 'bg-[#162416] text-[#22c55e] border border-[#1e3b1e]'
                }`}
              >
                {entry.isChance ? '連チャン' : '通常'}
              </button>
              <button
                onClick={() => removeRow(entry.id)}
                className="text-[#9aa0aa] hover:text-[#ef4444] text-[18px] leading-none transition-colors text-center"
              >
                ×
              </button>
            </div>
          ))}
        </div>

        <button
          onClick={addRow}
          className="mt-3 w-full py-2 rounded-lg border border-dashed border-[#2e333d] text-[13px] text-[#9aa0aa] hover:border-[#3b82f6] hover:text-[#3b82f6] transition-colors"
        >
          ＋ 行を追加
        </button>
      </div>

      {/* 結果欄 */}
      <div className="bg-[#0f1115] border border-[#2e333d] rounded-[14px] p-5 space-y-5">

        {/* 大当り回数 */}
        <div>
          <p className="text-[12px] text-[#9aa0aa] mb-2.5 font-medium uppercase tracking-wide">大当り回数</p>
          <div className="grid grid-cols-3 gap-2">
            <MetricCard label="総大当り" value={totalCount > 0 ? String(totalCount) : '-'} unit="回" />
            <MetricCard label="通常当選" value={normalCount > 0 ? String(normalCount) : '-'} unit="回" color="#22c55e" />
            <MetricCard label="連チャン" value={chanceCount > 0 ? String(chanceCount) : '-'} unit="回" color="#ef4444" />
          </div>
        </div>

        {/* 連チャン率バー */}
        {totalCount > 0 && (
          <div>
            <div className="flex justify-between text-[12px] mb-1.5">
              <span className="text-[#22c55e]">通常 {normalCount}回</span>
              <span className="text-[#9aa0aa]">連チャン率 {chanceRate}%</span>
              <span className="text-[#ef4444]">連チャン {chanceCount}回</span>
            </div>
            <div className="h-2 rounded-full bg-[#1a1d24] overflow-hidden flex">
              <div className="h-full bg-[#22c55e] transition-all" style={{ width: `${100 - (chanceRate ?? 0)}%` }} />
              <div className="h-full bg-[#ef4444] transition-all" style={{ width: `${chanceRate ?? 0}%` }} />
            </div>
          </div>
        )}

        <div className="border-t border-[#2e333d]" />

        {/* 通常回転数 */}
        <div>
          <p className="text-[12px] text-[#9aa0aa] mb-2.5 font-medium uppercase tracking-wide">通常回転数</p>
          <div className="grid grid-cols-2 gap-2 mb-2">
            <MetricCard label="合計" value={normalTotal > 0 ? normalTotal.toLocaleString() : '-'} unit="回転" color="#3b82f6" />
            <MetricCard label="平均" value={avgNormal != null ? avgNormal.toLocaleString() : '-'} unit="回転 / 当り" color="#3b82f6" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <MetricCard label="最多スタート" value={maxNormal != null ? maxNormal.toLocaleString() : '-'} unit="回転" />
            <MetricCard label="最少スタート" value={minNormal != null ? minNormal.toLocaleString() : '-'} unit="回転" />
          </div>
        </div>

        {/* サマリー */}
        {normalCount > 0 && (
          <div className="bg-[#1a1d24] rounded-[10px] px-4 py-3 text-[13px] text-[#9aa0aa] leading-relaxed">
            通常 <span className="text-[#e8eaed]">{normalCount}回</span> 当選、
            合計 <span className="text-[#3b82f6]">{normalTotal.toLocaleString()}回転</span> 消化。
            {avgNormal != null && (
              <> 平均 <span className="text-[#3b82f6]">{avgNormal.toLocaleString()}回転</span> で当選。</>
            )}
            {maxNormal != null && maxNormal >= 1000 && (
              <> 最大ハマり <span className="text-[#f59e0b]">{maxNormal.toLocaleString()}回転</span>。</>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

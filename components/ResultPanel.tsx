'use client';

import type { CalcResult } from '@/types';

interface Props {
  result: CalcResult | null;
  totalStart: number | null;
  border: number | null;
}

function MetricCard({ label, value, unit, labelColor }: { label: string; value: string; unit: string; labelColor?: string }) {
  return (
    <div className="bg-[#1a1d24] rounded-[10px] p-3.5">
      <p className="text-[12px] mb-1" style={{ color: labelColor ?? '#9aa0aa' }}>{label}</p>
      <p className="text-[20px] font-medium text-[#e8eaed]">{value}</p>
      <p className="text-[11px] text-[#9aa0aa] mt-0.5">{unit}</p>
    </div>
  );
}

function Badge({ judge, text }: { judge: 'good' | 'neutral' | 'bad' | null; text: string }) {
  const cls = judge === 'good'
    ? 'bg-[#16331f] text-[#4ade80]'
    : judge === 'bad'
    ? 'bg-[#3a1a1a] text-[#f87171]'
    : 'bg-[#232730] text-[#9aa0aa]';
  return <span className={`inline-block text-[13px] px-3.5 py-1 rounded-lg font-medium ${cls}`}>{text}</span>;
}

export default function ResultPanel({ result, totalStart, border }: Props) {
  const r = result;

  const judgeText = (() => {
    if (!r || r.toushiTama === null) return { badge: null, text: 'ラインを合わせてください' };
    if (!totalStart) return { badge: null, text: '累計スタートを入力してください' };
    if (!r.rate) return { badge: null, text: '赤ラインを最低点に合わせてください' };
    if (!border) return { badge: null, text: `${r.rate}回転 / 1000円` };
    const label = r.judge === 'good' ? '良好 ✓' : r.judge === 'bad' ? '要注意 ✗' : 'ボーダー付近';
    return { badge: r.judge, text: label };
  })();

  return (
    <div className="bg-[#0f1115] border border-[#2e333d] rounded-[14px] p-5">
      <div className="grid grid-cols-2 gap-2.5 mb-2.5">
        <MetricCard label="投資（差玉）" value={r?.toushiTama != null ? r.toushiTama.toLocaleString() : '-'} unit="玉" labelColor="#e24b4a" />
        <MetricCard label="持ち玉" value={r?.mochiTama != null ? r.mochiTama.toLocaleString() : '-'} unit="玉" labelColor="#f59e0b" />
      </div>
      <div className="grid grid-cols-3 gap-2.5 mb-4">
        <MetricCard label="推定投資額" value={r?.estimatedInvest != null && r.estimatedInvest > 0 ? Math.round(r.estimatedInvest).toLocaleString() : '-'} unit="円" />
        <MetricCard label="累計スタート" value={totalStart ? totalStart.toLocaleString() : '-'} unit="回転" />
        <MetricCard label="1000円/回転" value={r?.rate != null ? r.rate.toString() : '-'} unit="回転" />
      </div>
      <div className="border-t border-[#2e333d] pt-4">
        <Badge judge={judgeText.badge} text={judgeText.text} />
        {r?.judgeDetail && (
          <p className="text-[13px] text-[#9aa0aa] mt-2">{r.judgeDetail}</p>
        )}
        {!border && r?.rate != null && (
          <p className="text-[13px] text-[#9aa0aa] mt-2">ボーダー回転数を入力すると判定が表示されます。</p>
        )}
      </div>
    </div>
  );
}

'use client';

import type { CalcResult } from '@/types';

interface Props {
  result: CalcResult | null;
  totalStart: number | null;
}

export default function ResultPanel({ result, totalStart }: Props) {
  const rate = result?.rate ?? null;

  const statusText = (() => {
    if (!result || result.toushiTama === null) return '赤ラインを最低点に合わせてください';
    if (!totalStart) return '累計スタート回転数を入力してください';
    if (!rate) return 'ラインを正しく設定してください';
    return null;
  })();

  return (
    <div className="bg-white border border-[#E8E8EC] rounded-[24px] p-5 shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
      <p className="text-[12px] text-[#86868b] font-semibold uppercase tracking-wider mb-3">1000円あたり通常回転数</p>

      {statusText ? (
        <p className="text-[13px] text-[#86868b]">{statusText}</p>
      ) : (
        <p className="text-[52px] font-bold text-[#1D1D1F] leading-none">
          {rate}
          <span className="text-[20px] font-medium text-[#86868b] ml-2">回転</span>
        </p>
      )}
    </div>
  );
}

'use client';

import { useState } from 'react';
import GraphAnalyzer from './GraphAnalyzer';
import JackpotHistoryAnalyzer from './JackpotHistoryAnalyzer';
import type { CalcResult } from '@/types';

export default function TabLayout() {
  const [graphResult, setGraphResult] = useState<CalcResult | null>(null);

  return (
    <div className="min-h-screen">
      {/* ヘッダー */}
      <div className="max-w-[580px] mx-auto px-4 pt-8 pb-5">
        <h1 className="text-[22px] font-bold text-[#1D1D1F] tracking-tight">パチンコ台判別ツール</h1>
        <p className="text-[13px] text-[#86868b] mt-1">グラフ・履歴から台の状態を分析</p>
      </div>

      {/* グラフ分析 */}
      <div className="max-w-[580px] mx-auto px-4 mb-2">
        <p className="text-[11px] font-semibold text-[#86868b] uppercase tracking-wider mb-3">グラフ分析</p>
      </div>
      <GraphAnalyzer onResult={setGraphResult} />

      {/* 区切り */}
      <div className="max-w-[580px] mx-auto px-4 my-6">
        <div className="border-t border-[#E8E8EC]" />
      </div>

      {/* 大当り履歴 */}
      <div className="max-w-[580px] mx-auto px-4 mb-2">
        <p className="text-[11px] font-semibold text-[#86868b] uppercase tracking-wider mb-3">大当り履歴</p>
      </div>
      <JackpotHistoryAnalyzer graphResult={graphResult} />

      <div className="h-12" />
    </div>
  );
}

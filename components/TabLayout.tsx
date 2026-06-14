'use client';

import { useState } from 'react';
import GraphAnalyzer from './GraphAnalyzer';
import JackpotHistoryAnalyzer from './JackpotHistoryAnalyzer';

type Tab = 'graph' | 'jackpot';

const TABS: { key: Tab; label: string }[] = [
  { key: 'graph', label: 'グラフ分析' },
  { key: 'jackpot', label: '大当り履歴' },
];

export default function TabLayout() {
  const [tab, setTab] = useState<Tab>('graph');

  return (
    <div className="min-h-screen">
      <div className="max-w-[580px] mx-auto px-4 pt-4 pb-2">
        <div className="flex bg-[#1a1d24] rounded-[12px] p-1">
          {TABS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex-1 py-2 text-[14px] font-medium rounded-[10px] transition-colors ${
                tab === key
                  ? 'bg-[#232730] text-[#e8eaed]'
                  : 'text-[#9aa0aa] hover:text-[#c8cad0]'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
      {tab === 'graph' ? <GraphAnalyzer /> : <JackpotHistoryAnalyzer />}
    </div>
  );
}

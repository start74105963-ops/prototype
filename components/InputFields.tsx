'use client';

interface Props {
  totalStart: number | null;
  border: number | null;
  onTotalStartChange: (v: number | null) => void;
  onBorderChange: (v: number | null) => void;
}

export default function InputFields({ totalStart, border, onTotalStartChange, onBorderChange }: Props) {
  return (
    <div className="grid grid-cols-2 gap-3 mb-4">
      <div>
        <p className="text-[13px] text-[#9aa0aa] mb-1.5">累計スタート</p>
        <input
          type="number"
          placeholder="例: 1058"
          value={totalStart ?? ''}
          onChange={e => onTotalStartChange(e.target.value ? parseInt(e.target.value) : null)}
          className="w-full bg-[#232730] border border-[#2e333d] text-[#e8eaed] rounded-lg px-3 py-2 text-[15px] outline-none focus:border-[#3b82f6] transition-colors"
        />
      </div>
      <div>
        <p className="text-[13px] text-[#9aa0aa] mb-1.5">ボーダー回転数</p>
        <input
          type="number"
          placeholder="例: 17"
          value={border ?? ''}
          onChange={e => onBorderChange(e.target.value ? parseFloat(e.target.value) : null)}
          className="w-full bg-[#232730] border border-[#2e333d] text-[#e8eaed] rounded-lg px-3 py-2 text-[15px] outline-none focus:border-[#3b82f6] transition-colors"
        />
      </div>
    </div>
  );
}

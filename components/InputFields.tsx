'use client';

interface Props {
  totalStart: number | null;
  onTotalStartChange: (v: number | null) => void;
}

export default function InputFields({ totalStart, onTotalStartChange }: Props) {
  return (
    <div className="mb-4">
      <p className="text-[13px] text-[#86868b] mb-1.5 font-medium">累計スタート回転数</p>
      <input
        type="number"
        placeholder="例: 1058"
        value={totalStart ?? ''}
        onChange={e => onTotalStartChange(e.target.value ? parseInt(e.target.value) : null)}
        className="w-full bg-white border border-[#E8E8EC] text-[#1D1D1F] rounded-xl px-3 py-2.5 text-[15px] outline-none focus:border-[#9562E3] focus:ring-2 focus:ring-[#9562E3]/20 transition-all placeholder:text-[#C7C7CC]"
      />
    </div>
  );
}

'use client';

import { useRef, useEffect } from 'react';

interface Props {
  top: number;
  color: string;
  label: string;
  wrapHeight: number;
  onTopChange: (top: number) => void;
}

export default function DraggableLine({ top, color, label, wrapHeight, onTopChange }: Props) {
  const dragging = useRef(false);
  const startY = useRef(0);
  const startTop = useRef(0);

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (!dragging.current) return;
      const t = Math.max(0, Math.min(wrapHeight, startTop.current + (e.clientY - startY.current)));
      onTopChange(t);
    };
    const onTouchMove = (e: TouchEvent) => {
      if (!dragging.current) return;
      e.preventDefault();
      const t = Math.max(0, Math.min(wrapHeight, startTop.current + (e.touches[0].clientY - startY.current)));
      onTopChange(t);
    };
    const onUp = () => { dragging.current = false; };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('touchmove', onTouchMove, { passive: false });
    document.addEventListener('mouseup', onUp);
    document.addEventListener('touchend', onUp);
    return () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('touchmove', onTouchMove);
      document.removeEventListener('mouseup', onUp);
      document.removeEventListener('touchend', onUp);
    };
  }, [wrapHeight, onTopChange]);

  const onMouseDown = (e: React.MouseEvent) => {
    dragging.current = true;
    startY.current = e.clientY;
    startTop.current = top;
    e.preventDefault();
  };
  const onTouchStart = (e: React.TouchEvent) => {
    dragging.current = true;
    startY.current = e.touches[0].clientY;
    startTop.current = top;
    e.preventDefault();
  };

  return (
    <div
      className="absolute left-0 right-0 h-[34px] cursor-ns-resize z-10 touch-none"
      style={{ top: top - 17, transform: 'none' }}
      onMouseDown={onMouseDown}
      onTouchStart={onTouchStart}
    >
      {/* ライン */}
      <div className="absolute left-0 right-0 h-[2px]" style={{ backgroundColor: color, top: 16 }} />
      {/* グリップ */}
      <div
        className="absolute left-1/2 -translate-x-1/2 w-11 h-[18px] rounded-full flex items-center justify-center"
        style={{ backgroundColor: color, top: 8 }}
      >
        <span
          className="block w-4 h-0.5 relative"
          style={{
            background: '#fff',
            boxShadow: '0 4px 0 #fff, 0 -4px 0 #fff',
          }}
        />
      </div>
      {/* タグ */}
      <div
        className="absolute left-2 text-white text-[11px] font-medium px-2 py-0.5 rounded"
        style={{ backgroundColor: color, top: 8 }}
      >
        {label}
      </div>
    </div>
  );
}

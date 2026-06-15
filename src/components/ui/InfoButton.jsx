import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Info } from 'lucide-react';
import { INFO } from '../../data/infoTooltips';

export function InfoButton({ tooltipKey, className = '' }) {
  const ref = useRef(null);
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ x: 0, y: 0, flip: false });
  const data = INFO[tooltipKey];

  useEffect(() => {
    if (!open) return;
    const close = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    const onScroll = () => setOpen(false);
    document.addEventListener('mousedown', close);
    window.addEventListener('scroll', onScroll, true);
    window.addEventListener('resize', onScroll);
    return () => {
      document.removeEventListener('mousedown', close);
      window.removeEventListener('scroll', onScroll, true);
      window.removeEventListener('resize', onScroll);
    };
  }, [open]);

  const toggle = (e) => {
    e.stopPropagation();
    if (open) return setOpen(false);
    const r = ref.current.getBoundingClientRect();
    const w = 260;
    const spaceBelow = window.innerHeight - r.bottom;
    const flip = spaceBelow < 160;
    const x = Math.min(window.innerWidth - w - 12, Math.max(12, r.left - w / 2 + r.width / 2));
    const y = flip ? r.top - 8 : r.bottom + 8;
    setPos({ x, y, flip });
    setOpen(true);
  };

  if (!data) return null;
  return (
    <>
      <button
        ref={ref}
        type="button"
        aria-label={`What is ${data.t}`}
        onClick={toggle}
        className={`inline-flex h-4 w-4 items-center justify-center rounded-full text-text3 hover:text-gold hover:bg-gold-dim transition-colors ${className}`}
      >
        <Info size={12} strokeWidth={2.2} />
      </button>
      {open &&
        createPortal(
          <div
            className="tt-portal"
            style={{
              left: pos.x,
              top: pos.y,
              transform: pos.flip ? 'translateY(-100%)' : 'none',
            }}
          >
            <div className="tt-title">{data.t}</div>
            <div className="tt-body">{data.b}</div>
            {data.e && <div className="tt-eg">💡 {data.e}</div>}
          </div>,
          document.body
        )}
    </>
  );
}

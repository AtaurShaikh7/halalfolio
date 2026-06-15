import { fmtMonthYearLong } from '../../lib/format';

const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function labelFor(cell, idx) {
  if (cell.date) {
    const d = cell.date instanceof Date ? cell.date : new Date(cell.date);
    return MONTHS_SHORT[d.getUTCMonth()];
  }
  return MONTHS_SHORT[idx % 12];
}

function yearFor(cell, prevCell) {
  if (!cell.date) return null;
  const d = cell.date instanceof Date ? cell.date : new Date(cell.date);
  const prev = prevCell?.date ? (prevCell.date instanceof Date ? prevCell.date : new Date(prevCell.date)) : null;
  // Show the 2-digit year on the first cell, and whenever the year changes (typically at January).
  if (!prev || d.getUTCFullYear() !== prev.getUTCFullYear()) {
    return `'${String(d.getUTCFullYear()).slice(-2)}`;
  }
  return null;
}

export function MonthlyHeatmap({ heat }) {
  return (
    <div className="grid grid-cols-6 gap-1.5 sm:grid-cols-12">
      {heat.map((cell, i) => {
        const intensity = Math.min(Math.abs(cell.ret) / 6, 1);
        const bg =
          cell.ret >= 0
            ? `rgba(46,204,113,${0.12 + intensity * 0.55})`
            : `rgba(231,76,60,${0.12 + intensity * 0.55})`;
        const month = labelFor(cell, i);
        const year = yearFor(cell, heat[i - 1]);
        return (
          <div
            key={i}
            className="aspect-square rounded-md flex flex-col items-center justify-center text-center"
            style={{ background: bg, border: '1px solid var(--border2)' }}
            title={`${fmtMonthYearLong(cell.date) || month}: ${cell.ret >= 0 ? '+' : ''}${cell.ret.toFixed(2)}%`}
          >
            <span className="text-[9px] uppercase tracking-wider text-text2 leading-none">
              {month}
              {year && <span className="ml-0.5 text-text3">{year}</span>}
            </span>
            <span
              className="mt-0.5 font-playfair font-bold text-[11.5px] tabular-nums"
              style={{ color: cell.ret >= 0 ? 'var(--green)' : 'var(--red)' }}
            >
              {cell.ret >= 0 ? '+' : ''}
              {cell.ret.toFixed(1)}
            </span>
          </div>
        );
      })}
    </div>
  );
}

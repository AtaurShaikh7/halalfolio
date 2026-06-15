export function Badge({ kind = 'halal', children }) {
  const styles =
    kind === 'halal'
      ? { color: 'var(--green)', bg: 'rgba(46,204,113,0.12)', border: 'rgba(46,204,113,0.35)' }
      : { color: 'var(--red)', bg: 'rgba(231,76,60,0.12)', border: 'rgba(231,76,60,0.35)' };
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10.5px] font-semibold uppercase tracking-wider"
      style={{ color: styles.color, background: styles.bg, border: `1px solid ${styles.border}` }}
    >
      {children}
    </span>
  );
}

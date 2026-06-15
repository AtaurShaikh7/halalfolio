function Corner({ position }) {
  const map = {
    tl: 'top-3 left-3 border-t border-l rounded-tl-[3px]',
    tr: 'top-3 right-3 border-t border-r rounded-tr-[3px]',
    bl: 'bottom-3 left-3 border-b border-l rounded-bl-[3px]',
    br: 'bottom-3 right-3 border-b border-r rounded-br-[3px]',
  };
  return (
    <span
      aria-hidden="true"
      className={`pointer-events-none absolute h-4 w-4 ${map[position]}`}
      style={{ borderColor: 'var(--gold)', opacity: 0.6 }}
    />
  );
}

export function FormCard({ children }) {
  return (
    <div
      className="relative mx-auto w-full max-w-3xl rounded-2xl border bg-card p-7 shadow-card"
      style={{
        borderColor: 'var(--border)',
        backgroundImage:
          'radial-gradient(circle at 100% 0%, var(--gold-glow), transparent 60%)',
      }}
    >
      <Corner position="tl" />
      <Corner position="tr" />
      <Corner position="bl" />
      <Corner position="br" />
      {children}
    </div>
  );
}

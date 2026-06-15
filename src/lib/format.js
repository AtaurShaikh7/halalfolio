// Display helpers — keep all date/currency formatting in one place.

const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function toDate(d) {
  if (d instanceof Date) return d;
  if (typeof d === 'string' || typeof d === 'number') return new Date(d);
  return null;
}

// "Jun '26"
export function fmtMonthYear(d) {
  const date = toDate(d);
  if (!date || Number.isNaN(date.getTime())) return '';
  return `${MONTHS_SHORT[date.getUTCMonth()]} '${String(date.getUTCFullYear()).slice(-2)}`;
}

// "Jun 2026"
export function fmtMonthYearLong(d) {
  const date = toDate(d);
  if (!date || Number.isNaN(date.getTime())) return '';
  return `${MONTHS_SHORT[date.getUTCMonth()]} ${date.getUTCFullYear()}`;
}

// "12 Jun 2026"
export function fmtDate(d) {
  const date = toDate(d);
  if (!date || Number.isNaN(date.getTime())) return '';
  return `${String(date.getUTCDate()).padStart(2, '0')} ${MONTHS_SHORT[date.getUTCMonth()]} ${date.getUTCFullYear()}`;
}

// "₹1,23,456" — Indian number system
export function fmtINR(n) {
  if (!Number.isFinite(n)) return '—';
  return '₹' + Math.round(n).toLocaleString('en-IN');
}

// "₹1.23 Cr" / "₹12.3 L"
export function fmtINRCompact(n) {
  if (!Number.isFinite(n)) return '—';
  const abs = Math.abs(n);
  if (abs >= 1_00_00_000) return `₹${(n / 1_00_00_000).toFixed(2)} Cr`;
  if (abs >= 1_00_000) return `₹${(n / 1_00_000).toFixed(2)} L`;
  if (abs >= 1000) return `₹${(n / 1000).toFixed(1)}k`;
  return `₹${Math.round(n)}`;
}

// Add (or subtract) calendar months to a Date — returns new Date in UTC.
export function addMonths(d, k) {
  const date = toDate(d) ?? new Date();
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + k, 1, 12));
}

// First-of-month version of `d`, in UTC.
export function startOfMonth(d) {
  const date = toDate(d) ?? new Date();
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1, 12));
}

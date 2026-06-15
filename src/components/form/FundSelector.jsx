import { ChevronDown } from 'lucide-react';
import { useAnalysisStore } from '../../store/useAnalysisStore';
import { CATEGORIES, LISTS } from '../../data/fundLists';

function Select({ value, onChange, options, placeholder }) {
  return (
    <div className="relative">
      <select
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        className="w-full appearance-none rounded-lg border bg-card2 px-3.5 py-2.5 pr-9 text-[14px] text-text outline-none transition-colors focus:border-gold"
        style={{ borderColor: 'var(--border)' }}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((o) => (
          <option key={o.key} value={o.key}>
            {o.label}
          </option>
        ))}
      </select>
      <ChevronDown
        size={16}
        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-text2"
      />
    </div>
  );
}

export function FundSelector() {
  const { category, fundKey, setCategory, setFundKey } = useAnalysisStore();
  const funds = LISTS[category] || [];
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <label className="block">
        <div className="mb-1.5 text-[11px] uppercase tracking-wider text-text2 font-semibold">
          Category
        </div>
        <Select
          value={category}
          onChange={(v) => {
            setCategory(v);
            const first = LISTS[v]?.[0]?.key;
            if (first) setFundKey(first);
          }}
          options={CATEGORIES}
        />
      </label>
      <label className="block">
        <div className="mb-1.5 text-[11px] uppercase tracking-wider text-text2 font-semibold">
          Fund
        </div>
        <Select value={fundKey} onChange={setFundKey} options={funds} placeholder="Select fund…" />
      </label>
    </div>
  );
}

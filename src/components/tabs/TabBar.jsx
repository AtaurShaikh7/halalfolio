import { useAnalysisStore } from '../../store/useAnalysisStore';

const TABS = [
  { id: 't-ret', label: 'Returns', icon: '📈' },
  { id: 't-risk', label: 'Risk', icon: '🎯' },
  { id: 't-cons', label: 'Consistency', icon: '📅' },
  { id: 't-hlth', label: 'Fund Health', icon: '🏦' },
  { id: 't-shar', label: 'Sharia', icon: '☪' },
  { id: 't-hold', label: 'Holdings', icon: '📋' },
];

export function TabBar() {
  const { activeTab, setActiveTab } = useAnalysisStore();
  return (
    <div
      className="sticky top-14 z-20 -mx-4 mb-4 overflow-x-auto border-b sm:mx-0 sm:rounded-t-xl"
      style={{
        borderColor: 'var(--border)',
        background: 'color-mix(in srgb, var(--bg) 92%, transparent)',
        backdropFilter: 'blur(8px)',
      }}
    >
      <div className="flex min-w-max gap-1 px-4 py-2 sm:px-2">
        {TABS.map((t) => {
          const active = activeTab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setActiveTab(t.id)}
              className={`relative h-10 px-3.5 rounded-lg text-[13px] font-semibold transition-colors ${
                active ? 'text-gold' : 'text-text2 hover:text-text'
              }`}
            >
              <span className="mr-1.5">{t.icon}</span>
              {t.label}
              {active && (
                <span
                  className="absolute -bottom-[9px] left-2 right-2 h-[2px] rounded-full"
                  style={{ background: 'linear-gradient(90deg, var(--gold), var(--gold2))' }}
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export { TABS };

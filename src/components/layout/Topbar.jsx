import { Moon, Sun } from 'lucide-react';
import { useThemeStore } from '../../store/useThemeStore';

export function Topbar() {
  const { isDark, toggle } = useThemeStore();
  return (
    <header
      className="sticky top-0 z-30 h-14 border-b backdrop-blur"
      style={{
        background: 'color-mix(in srgb, var(--topbar) 92%, transparent)',
        borderColor: 'var(--border)',
      }}
    >
      <div className="mx-auto flex h-full max-w-6xl items-center gap-3 px-6">
        <div className="flex items-center gap-2.5">
          <div
            className="flex h-9 w-9 items-center justify-center rounded-lg text-lg shadow-gold"
            style={{
              background:
                'linear-gradient(135deg, var(--gold2) 0%, var(--gold) 60%, color-mix(in srgb, var(--gold) 50%, black) 100%)',
              color: '#1a1610',
            }}
            aria-hidden="true"
          >
            ☪
          </div>
          <div className="leading-tight">
            <div className="font-playfair text-[19px] font-bold tracking-tight">
              Halal<span className="text-gold">Folio</span>
            </div>
            <div className="text-[10.5px] uppercase tracking-[0.18em] text-text2">
              Sharia Fund Analyzer
            </div>
          </div>
        </div>

        <div className="flex-1" />

        <button
          type="button"
          onClick={toggle}
          aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
          className="group flex items-center gap-0.5 rounded-full border bg-card2 p-1 transition-colors hover:border-gold"
          style={{ borderColor: 'var(--border)' }}
        >
          <span
            className={`flex h-7 w-7 items-center justify-center rounded-full text-[14px] transition-all ${
              isDark ? 'bg-gold text-[#1a1610] shadow-gold' : 'text-text2'
            }`}
          >
            <Moon size={14} strokeWidth={2.2} />
          </span>
          <span
            className={`flex h-7 w-7 items-center justify-center rounded-full text-[14px] transition-all ${
              !isDark ? 'bg-gold text-[#1a1610] shadow-gold' : 'text-text2'
            }`}
          >
            <Sun size={14} strokeWidth={2.2} />
          </span>
        </button>
      </div>
    </header>
  );
}

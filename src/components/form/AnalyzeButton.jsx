import { Sparkles, Loader2 } from 'lucide-react';
import { useAnalysisStore } from '../../store/useAnalysisStore';
import { useAnalyze } from '../../hooks/useAnalysis';

export function AnalyzeButton() {
  const isLoading = useAnalysisStore((s) => s.isLoading);
  const fundKey = useAnalysisStore((s) => s.fundKey);
  const analyze = useAnalyze();
  const disabled = isLoading || !fundKey;
  return (
    <button
      type="button"
      onClick={analyze}
      disabled={disabled}
      className="group relative inline-flex h-12 w-full items-center justify-center gap-2 overflow-hidden rounded-xl font-semibold tracking-wide transition-transform active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed"
      style={{
        background: 'linear-gradient(135deg, var(--gold2) 0%, var(--gold) 100%)',
        color: '#1a1610',
        boxShadow: '0 10px 30px var(--gold-glow), inset 0 1px 0 rgba(255,255,255,0.25)',
      }}
    >
      {isLoading ? (
        <>
          <Loader2 size={18} className="animate-spin" />
          Analyzing…
        </>
      ) : (
        <>
          <Sparkles size={18} />
          Run Sharia Analysis
        </>
      )}
    </button>
  );
}

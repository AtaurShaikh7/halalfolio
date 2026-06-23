import { AnimatePresence, motion } from 'framer-motion';
import { Shell } from '../components/layout/Shell';
import { HadithHero } from '../components/layout/HadithHero';
import { FormCard } from '../components/form/FormCard';
import { FundSelector } from '../components/form/FundSelector';
import { PeriodChips } from '../components/form/PeriodChips';
import { AnalyzeButton } from '../components/form/AnalyzeButton';
import { LoadingState } from '../components/form/LoadingState';
import { Verdict } from '../components/ui/Verdict';
import { SipCalculator } from '../components/SipCalculator';
import { HalalBasket } from '../components/HalalBasket';
import { TabBar } from '../components/tabs/TabBar';
import { ReturnsTab } from '../components/tabs/ReturnsTab';
import { RiskTab } from '../components/tabs/RiskTab';
import { ConsistencyTab } from '../components/tabs/ConsistencyTab';
import { HealthTab } from '../components/tabs/HealthTab';
import { ShariaTab } from '../components/tabs/ShariaTab';
import { HoldingsTab } from '../components/tabs/HoldingsTab';
import { useAnalysisStore } from '../store/useAnalysisStore';
import { FUNDS } from '../data/funds';

function ActiveTab() {
  const { activeTab, results, fundKey } = useAnalysisStore();
  const fund = FUNDS[fundKey];
  if (!results) return null;
  switch (activeTab) {
    case 't-ret': return <ReturnsTab r={results} />;
    case 't-risk': return <RiskTab r={results} />;
    case 't-cons': return <ConsistencyTab r={results} />;
    case 't-hlth': return <HealthTab r={results} fund={fund} />;
    case 't-shar': return <ShariaTab r={results} />;
    case 't-hold': return <HoldingsTab r={results} />;
    case 't-bask': return <HalalBasket r={results} />;
    default: return null;
  }
}

export function AnalyzerPage() {
  const { isLoading, results, activeTab, fundKey } = useAnalysisStore();
  const fund = FUNDS[fundKey];

  return (
    <Shell>
      <HadithHero />

      <div className="mb-8">
        <FormCard>
          <div className="text-center mb-5">
            <div className="font-playfair text-[22px] font-semibold leading-tight">
              Analyze any fund through a <span className="text-gold">Sharia lens</span>
            </div>
            <p className="mt-1 text-[13px] text-text2">
              See the true cost of compliance — returns, risk, drawdowns and the purified portfolio in one click.
            </p>
          </div>
          <div className="space-y-4">
            <FundSelector />
            <div className="flex flex-col-reverse items-stretch gap-4 sm:flex-row sm:items-end sm:justify-between">
              <PeriodChips />
              <div className="sm:w-[260px]">
                <AnalyzeButton />
              </div>
            </div>
          </div>
        </FormCard>
      </div>

      {isLoading && <LoadingState />}

      {!isLoading && results && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] uppercase tracking-[0.2em] text-gold">Analysis</span>
                {results.source === 'live' ? (
                  <span
                    className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider"
                    style={{
                      color: 'var(--green)',
                      background: 'rgba(46,204,113,0.12)',
                      border: '1px solid rgba(46,204,113,0.35)',
                    }}
                  >
                    <span
                      className="h-1.5 w-1.5 rounded-full"
                      style={{ background: 'var(--green)', boxShadow: '0 0 6px var(--green)' }}
                    />
                    Live · mfapi.in
                  </span>
                ) : (
                  <span
                    className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider"
                    style={{
                      color: 'var(--text2)',
                      background: 'var(--border2)',
                      border: '1px solid var(--border)',
                    }}
                  >
                    Simulated
                  </span>
                )}
              </div>
              <h2 className="font-playfair text-[24px] font-bold leading-tight text-text">
                {fund.name}
              </h2>
              <div className="text-[12.5px] text-text2">
                {fund.amc} · Managed by {fund.mgr} · {fund.tenure} tenure
                {results.source === 'live' && results.seriesEnd && (
                  <>
                    {' '}
                    · NAV as of{' '}
                    <span className="font-semibold text-text">
                      {results.seriesEnd.toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </span>
                  </>
                )}
              </div>
            </div>
            <div className="text-right text-[12px] text-text2">
              <div>
                Halal mix:{' '}
                <span className="font-semibold text-up tabular-nums">{results.halalW.toFixed(1)}%</span>
              </div>
              <div>
                Removed:{' '}
                <span className="font-semibold text-down tabular-nums">{results.removed} holdings</span>
              </div>
            </div>
          </div>

          {results.warning && (
            <div
              className="rounded-lg border px-3 py-2 text-[12.5px]"
              style={{
                borderColor: 'var(--orange)',
                background: 'rgba(243,156,18,0.08)',
                color: 'var(--orange)',
              }}
            >
              ⚠ {results.warning}
            </div>
          )}

          <Verdict verdict={results.verdict} delta={results.delta} />

          <SipCalculator r={results} />

          <TabBar />

          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
            >
              <ActiveTab />
            </motion.div>
          </AnimatePresence>
        </div>
      )}

      {!isLoading && !results && (
        <div className="mx-auto mt-6 max-w-2xl text-center text-[13px] text-text2">
          Pick a category, fund and period above, then tap{' '}
          <span className="font-semibold text-gold">Run Sharia Analysis</span> to see the full breakdown.
        </div>
      )}
    </Shell>
  );
}

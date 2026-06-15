export function HadithHero() {
  return (
    <section className="relative mx-auto max-w-2xl px-6 pt-12 pb-6 text-center">
      <div className="mb-3 flex items-center justify-center gap-3">
        <span className="h-px w-12 bg-gradient-to-r from-transparent to-gold/60" />
        <span className="text-[10.5px] font-semibold uppercase tracking-[0.28em] text-gold">
          Hadith
        </span>
        <span className="h-px w-12 bg-gradient-to-l from-transparent to-gold/60" />
      </div>
      <p
        dir="rtl"
        className="font-amiri text-[26px] leading-[1.8] text-gold"
        style={{ textShadow: '0 0 28px var(--gold-glow)' }}
      >
        لَعَنَ رَسُولُ اللَّهِ ﷺ آكِلَ الرِّبَا وَمُوكِلَهُ وَكَاتِبَهُ وَشَاهِدَيْهِ
      </p>
      <p className="mt-3 font-playfair text-[16.5px] italic leading-relaxed text-text">
        “The Messenger of Allah ﷺ cursed the consumer of Riba, the one who pays it, the one who
        records it, and the two witnesses — they are all equal.”
      </p>
      <p className="mt-2 text-[11px] font-semibold tracking-[0.22em] uppercase text-gold/90">
        — Sahih Muslim 1598
      </p>
    </section>
  );
}

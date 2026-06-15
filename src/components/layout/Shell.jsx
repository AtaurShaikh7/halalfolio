import { Topbar } from './Topbar';
import { IslamicPattern } from './IslamicPattern';

export function Shell({ children }) {
  return (
    <div className="relative min-h-dvh">
      <IslamicPattern />
      <Topbar />
      <main className="relative mx-auto max-w-6xl px-4 pb-24 sm:px-6">{children}</main>
      <footer className="relative border-t mt-12 py-6 text-center text-[11px] text-text2">
        © {new Date().getFullYear()} HalalFolio · Prototype · Not investment advice.
      </footer>
    </div>
  );
}

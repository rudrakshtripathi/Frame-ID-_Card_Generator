import { ArrowUpRight, Compass } from 'lucide-react';
import { Link } from 'wouter';

export default function NotFound() {
  return (
    <main className="grain flex min-h-[100dvh] items-center justify-center bg-primary px-5 py-10 text-cream">
      <section className="w-full max-w-lg">
        <div className="mb-8 flex items-center gap-3 font-mono text-[10px] font-bold uppercase tracking-[.16em] text-secondary">
          <Compass className="h-4 w-4" /> Frame lab / lost signal
        </div>
        <h1 className="font-serif text-7xl font-black leading-[.85] tracking-[-.08em] text-cream sm:text-9xl">No face<br />here.</h1>
        <p className="mt-7 max-w-sm text-sm leading-6 text-cream/65">That path wandered off the map. Come back to the frame maker and leave a better signal.</p>
        <Link href="/" data-testid="link-not-found-home" className="mt-8 inline-flex h-13 items-center gap-3 rounded-xl bg-secondary px-6 font-bold text-primary transition-transform hover:-translate-y-1">Back to the frame lab <ArrowUpRight className="h-5 w-5" /></Link>
      </section>
    </main>
  );
}
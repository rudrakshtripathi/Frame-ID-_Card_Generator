import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useCreateShare, useHealthCheck, getHealthCheckQueryKey } from '@workspace/api-client-react';
import { ArrowUpRight, Check, Download, LoaderCircle, RotateCcw, Share2, Sparkles, Upload, X } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, Route, Switch, useParams } from 'wouter';
import logoWordmark from '@assets/0_Screenshot_from_2026-08-08_01-15-18_1786131926995.png';
import NotFound from '@/pages/not-found';

type AppState = 'idle' | 'processing' | 'ready' | 'error';

const queryClient = new QueryClient();
const MAX_FILE_SIZE = 25 * 1024 * 1024;
const ALLOWED_EXTENSIONS = ['jpg', 'jpeg', 'png', 'heic'];

function makeFrame(source: HTMLImageElement): string {
  const canvas = document.createElement('canvas');
  canvas.width = 1000;
  canvas.height = 1000;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Your browser could not start the frame canvas.');

  const green = '#075c3c';
  const darkGreen = '#064b32';
  const yellow = '#ffd32a';
  const cream = '#fff8dc';
  const pink = '#f52f88';

  ctx.fillStyle = green;
  ctx.fillRect(0, 0, 1000, 1000);

  // Crop the source to a circle, leaving a generous green frame around it.
  const side = Math.min(source.naturalWidth, source.naturalHeight);
  const sx = (source.naturalWidth - side) / 2;
  const sy = (source.naturalHeight - side) / 2;
  ctx.save();
  ctx.beginPath();
  ctx.arc(500, 500, 331, 0, Math.PI * 2);
  ctx.clip();
  ctx.drawImage(source, sx, sy, side, side, 169, 169, 662, 662);
  ctx.restore();

  // Circular keyline and topographic ring.
  ctx.strokeStyle = yellow;
  ctx.lineWidth = 12;
  ctx.beginPath();
  ctx.arc(500, 500, 342, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = pink;
  ctx.lineWidth = 3;
  ctx.setLineDash([12, 13]);
  ctx.beginPath();
  ctx.arc(500, 500, 360, 0.05, Math.PI * 1.95);
  ctx.stroke();
  ctx.setLineDash([]);

  // Goa sun and horizon.
  ctx.fillStyle = yellow;
  ctx.beginPath();
  ctx.arc(500, 132, 48, Math.PI, 0);
  ctx.fill();
  ctx.strokeStyle = yellow;
  ctx.lineWidth = 5;
  for (let i = 0; i < 9; i += 1) {
    const x = 445 + i * 14;
    ctx.beginPath();
    ctx.moveTo(x, 80);
    ctx.lineTo(x + 7, 67);
    ctx.stroke();
  }
  ctx.strokeStyle = cream;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(374, 137);
  ctx.lineTo(626, 137);
  ctx.stroke();

  // Small maker grid / isometric blocks.
  ctx.strokeStyle = pink;
  ctx.lineWidth = 4;
  for (let i = 0; i < 4; i += 1) {
    const x = 90 + i * 30;
    const y = 790 - i * 10;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + 17, y - 10);
    ctx.lineTo(x + 34, y);
    ctx.lineTo(x + 17, y + 10);
    ctx.closePath();
    ctx.stroke();
  }
  ctx.fillStyle = yellow;
  ctx.fillRect(830, 782, 78, 8);
  ctx.fillRect(830, 798, 48, 8);

  // Palm silhouettes, built from simple geometric strokes.
  ctx.strokeStyle = darkGreen;
  ctx.lineWidth = 9;
  ctx.beginPath();
  ctx.moveTo(105, 878);
  ctx.quadraticCurveTo(118, 820, 110, 763);
  ctx.stroke();
  ctx.lineWidth = 5;
  [[110, 775, 71, 740], [112, 778, 147, 735], [111, 782, 81, 793], [112, 780, 150, 788]].forEach(([x, y, x2, y2]) => {
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.quadraticCurveTo((x + x2) / 2, y2 - 8, x2, y2);
    ctx.stroke();
  });
  ctx.strokeStyle = cream;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(860, 884);
  ctx.lineTo(860, 772);
  ctx.moveTo(860, 800);
  ctx.lineTo(821, 770);
  ctx.moveTo(861, 797);
  ctx.lineTo(899, 765);
  ctx.stroke();

  // Event typography and footer ribbon.
  ctx.fillStyle = cream;
  ctx.textAlign = 'center';
  ctx.font = '700 22px "Space Mono", monospace';
  ctx.letterSpacing = '5px';
  ctx.fillText('HACKERS HOUSE', 500, 57);
  ctx.fillStyle = yellow;
  ctx.font = '800 93px "Fraunces", Georgia, serif';
  ctx.fillText('GOA', 500, 938);
  ctx.fillStyle = cream;
  ctx.font = '700 22px "Space Mono", monospace';
  ctx.fillText('2026  /  BUILD IN PUBLIC', 500, 976);
  ctx.textAlign = 'left';
  ctx.fillStyle = pink;
  ctx.font = '700 17px "Space Mono", monospace';
  ctx.fillText('FRAME IN GOA', 70, 92);
  ctx.save();
  ctx.translate(934, 600);
  ctx.rotate(Math.PI / 2);
  ctx.fillStyle = cream;
  ctx.fillText('MAKE / SHARE / RETURN', 0, 0);
  ctx.restore();

  // Registration marks make it feel like an event artifact rather than a filter.
  ctx.strokeStyle = cream;
  ctx.lineWidth = 3;
  [[59, 59, 30, 0], [59, 59, 0, 30], [941, 59, -30, 0], [941, 59, 0, 30], [59, 941, 30, 0], [59, 941, 0, -30], [941, 941, -30, 0], [941, 941, 0, -30]].forEach(([x, y, dx, dy]) => {
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + dx, y + dy);
    ctx.stroke();
  });

  return canvas.toDataURL('image/png');
}

function absolutePath(path: string): string {
  return new URL(path, window.location.origin).toString();
}

function BrandHeader() {
  return (
    <header className="relative z-10 mx-auto flex w-full max-w-6xl items-center justify-between px-5 py-5 sm:px-8">
      <Link href="/" data-testid="link-home" className="group flex items-center gap-3">
        <img src={logoWordmark} alt="Hackers House" className="h-9 w-[145px] rounded-[2px] object-cover object-center transition-transform group-hover:scale-[1.03]" />
        <span className="hidden border-l border-primary/25 pl-3 font-mono text-[10px] font-bold uppercase tracking-[.18em] text-primary sm:block">Goa 2026</span>
      </Link>
      <a href="https://hhgoa.com" target="_blank" rel="noreferrer" data-testid="link-event-site" className="group flex items-center gap-1 font-mono text-[10px] font-bold uppercase tracking-[.16em] text-primary/70 transition-colors hover:text-accent">
        The gathering <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
      </a>
    </header>
  );
}

function ExampleFrame() {
  return (
    <div className="relative mx-auto aspect-square w-full max-w-[340px] rotate-[2deg] overflow-hidden rounded-[2.25rem] bg-primary p-3 shadow-lg transition-transform duration-500 hover:rotate-0">
      <div className="relative flex h-full w-full items-center justify-center overflow-hidden rounded-[1.8rem] border-2 border-secondary bg-[#156f4b]">
        <div className="absolute inset-6 rounded-full border-2 border-dashed border-accent/70" />
        <div className="absolute left-1/2 top-[18%] h-[50%] w-[50%] -translate-x-1/2 rounded-full bg-[#d8b69a]" />
        <div className="absolute left-1/2 top-[30%] h-[30%] w-[34%] -translate-x-1/2 rounded-full bg-[#39413d]" />
        <div className="absolute left-1/2 top-9 -translate-x-1/2 font-mono text-[9px] font-bold uppercase tracking-[.28em] text-cream">Hackers House</div>
        <div className="absolute bottom-12 left-1/2 -translate-x-1/2 font-serif text-6xl font-black tracking-[-.1em] text-secondary">GOA</div>
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap font-mono text-[8px] font-bold tracking-[.2em] text-cream">2026 / BUILD IN PUBLIC</div>
        <div className="absolute bottom-14 left-8 h-8 w-7 border-b-2 border-l-2 border-accent/80" />
        <div className="absolute right-8 top-16 h-7 w-10 border-r-2 border-t-2 border-secondary/90" />
        <div className="absolute right-8 top-10 h-2 w-2 rounded-full bg-accent" />
      </div>
    </div>
  );
}

function ErrorNotice({ message, onDismiss }: { message: string; onDismiss?: () => void }) {
  return (
    <div role="alert" data-testid="status-error" className="flex items-start gap-3 rounded-2xl border border-destructive/25 bg-destructive/8 p-4 text-sm text-destructive">
      <X className="mt-0.5 h-4 w-4 shrink-0" />
      <span className="flex-1">{message}</span>
      {onDismiss ? <button onClick={onDismiss} data-testid="button-dismiss-error" className="rounded-full p-1 hover:bg-destructive/10" aria-label="Dismiss error"><X className="h-4 w-4" /></button> : null}
    </div>
  );
}

function Home() {
  const [state, setState] = useState<AppState>('idle');
  const [filePreview, setFilePreview] = useState('');
  const [frameData, setFrameData] = useState('');
  const [error, setError] = useState('');
  const [shareError, setShareError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const objectUrlRef = useRef('');
  const health = useHealthCheck({ query: { queryKey: getHealthCheckQueryKey(), staleTime: 60_000, retry: 1 } });
  const createShare = useCreateShare();

  useEffect(() => () => {
    if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
  }, []);

  const reset = useCallback(() => {
    if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    objectUrlRef.current = '';
    setState('idle');
    setFilePreview('');
    setFrameData('');
    setError('');
    setShareError('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, []);

  const processFile = useCallback((file?: File) => {
    if (!file) return;
    setError('');
    setShareError('');
    const extension = file.name.toLowerCase().split('.').pop() ?? '';
    if (!ALLOWED_EXTENSIONS.includes(extension)) {
      setState('error');
      setError('That file type is not supported. Choose a JPG, JPEG, PNG, or HEIC image.');
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      setState('error');
      setError('That image is over 25 MB. Choose a smaller photo so your frame stays quick to make.');
      return;
    }
    const objectUrl = URL.createObjectURL(file);
    objectUrlRef.current = objectUrl;
    setFilePreview(objectUrl);
    setState('processing');
    const image = new Image();
    image.onload = () => {
      try {
        setFrameData(makeFrame(image));
        setState('ready');
      } catch (compositionError) {
        setState('error');
        setError(compositionError instanceof Error ? compositionError.message : 'We could not draw that frame. Try another image.');
      }
    };
    image.onerror = () => {
      setState('error');
      setError(extension === 'heic'
        ? 'This browser cannot decode HEIC files yet. Export the photo as JPG or PNG and try again.'
        : 'We could not read that image. Try opening it in your photos app, exporting it, and uploading it again.');
    };
    image.src = objectUrl;
  }, []);

  const handleShare = useCallback(() => {
    if (!frameData || createShare.isPending) return;
    setShareError('');
    const popup = window.open('', '_blank', 'noopener,noreferrer');
    createShare.mutate({ data: { imageData: frameData } }, {
      onSuccess: (share) => {
        try {
          window.localStorage.setItem(`hh-goa-share-${share.id}`, share.imagePath);
        } catch {
          // Storage can be unavailable in private browsing; the share still works.
        }
        const shareUrl = absolutePath(share.sharePath);
        const caption = `Built in Goa. Wearing the Hackers House frame for 2026. #FrameInGoa`;
        const intent = `https://twitter.com/intent/tweet?text=${encodeURIComponent(caption)}&url=${encodeURIComponent(shareUrl)}`;
        if (popup) popup.location.href = intent;
        else window.open(intent, '_blank', 'noopener,noreferrer');
      },
      onError: () => {
        popup?.close();
        setShareError('Sharing is taking a breather. Download your PNG below — you can try X again in a moment.');
      },
    });
  }, [createShare, frameData]);

  const download = useCallback(() => {
    if (!frameData) return;
    const anchor = document.createElement('a');
    anchor.href = frameData;
    anchor.download = 'hh-goa-2026-frame.png';
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
  }, [frameData]);

  const renderMain = () => {
    if (state === 'ready' && frameData) {
      return (
        <section className="animate-rise-in grid items-center gap-10 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="relative overflow-hidden rounded-[2rem] bg-primary p-3 shadow-lg sm:p-5">
            <img src={frameData} alt="Your HH Goa 2026 profile frame" data-testid="img-generated-frame" className="mx-auto aspect-square w-full max-w-[620px] rounded-[1.4rem] object-contain" />
            <div className="absolute left-6 top-6 flex items-center gap-2 rounded-full bg-secondary px-3 py-1.5 font-mono text-[9px] font-bold uppercase tracking-[.12em] text-primary sm:left-8 sm:top-8"><Check className="h-3 w-3" /> Ready to take with you</div>
          </div>
          <div className="flex flex-col">
            <span className="mono-label text-accent">Your maker mark is ready</span>
            <h1 className="mt-3 font-serif text-4xl font-black leading-[.95] tracking-[-.06em] text-primary sm:text-5xl">You are in<br />the build.</h1>
            <p className="mt-5 max-w-sm text-sm leading-6 text-primary/70">Save your frame, make it your profile picture, or send it into the builder stream.</p>
            <div className="mt-7 flex flex-col gap-3">
              <button onClick={download} data-testid="button-download-frame" className="flex h-14 items-center justify-center gap-3 rounded-xl bg-primary px-5 font-bold text-secondary shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0"><Download className="h-5 w-5" /> Download PNG</button>
              <button onClick={handleShare} disabled={createShare.isPending} data-testid="button-share-x" className="flex h-14 items-center justify-center gap-3 rounded-xl border-2 border-primary bg-transparent px-5 font-bold text-primary transition-all hover:-translate-y-0.5 hover:bg-primary hover:text-secondary disabled:cursor-wait disabled:opacity-65">
                {createShare.isPending ? <LoaderCircle className="h-5 w-5 animate-spin" /> : <Share2 className="h-5 w-5" />}
                {createShare.isPending ? 'Making your share link…' : 'Share to X'}
              </button>
            </div>
            {shareError ? <div className="mt-4"><ErrorNotice message={shareError} /></div> : null}
            <button onClick={reset} data-testid="button-start-over" className="mt-5 flex items-center justify-center gap-2 py-2 text-xs font-bold text-primary/55 transition-colors hover:text-accent"><RotateCcw className="h-3.5 w-3.5" /> Use a different photo</button>
          </div>
        </section>
      );
    }

    if (state === 'processing') {
      return (
        <section className="animate-rise-in grid items-center gap-9 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="relative mx-auto w-full max-w-[620px] overflow-hidden rounded-[2rem] bg-primary p-3 shadow-lg sm:p-5">
            {filePreview ? <img src={filePreview} alt="Your photo being placed into the HH Goa frame" data-testid="img-processing-photo" className="aspect-square w-full rounded-[1.4rem] object-cover opacity-75" /> : <div className="aspect-square w-full rounded-[1.4rem] bg-primary/70" />}
            <div className="absolute inset-0 flex items-center justify-center"><div className="flex flex-col items-center gap-4 rounded-2xl bg-primary/90 px-7 py-6 text-center text-secondary"><LoaderCircle className="h-7 w-7 animate-spin" /><span className="font-mono text-[10px] font-bold uppercase tracking-[.16em]">Drawing your Goa layer</span><span className="h-0.5 w-20 origin-center bg-secondary animate-pulse-line" /></div></div>
          </div>
          <div><span className="mono-label text-accent">One sec, builder</span><h1 className="mt-3 font-serif text-4xl font-black leading-[.95] tracking-[-.06em] text-primary">Making room<br />for your face.</h1><p className="mt-5 text-sm leading-6 text-primary/70">Centering your photo, then adding the sun, palms, and the 2026 mark.</p></div>
        </section>
      );
    }

    return (
      <section className="grid items-center gap-10 lg:grid-cols-[minmax(0,1fr)_420px]">
        <div className="animate-rise-in">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-accent/25 bg-accent/8 px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-[.14em] text-accent"><Sparkles className="h-3.5 w-3.5" /> A tiny Goa ritual for builders</div>
          <h1 data-testid="text-hero-heading" className="max-w-2xl font-serif text-[clamp(3.7rem,12vw,7.7rem)] font-black leading-[.82] tracking-[-.08em] text-primary">Put your<br /><span className="text-accent">face</span> in Goa.</h1>
          <p className="mt-8 max-w-md text-base leading-7 text-primary/70 sm:text-lg">One photo. One unmistakable frame. A little proof that you were here building in public with Hackers House.</p>
          <div className="mt-8">
            <input ref={fileInputRef} type="file" accept=".jpg,.jpeg,.png,.heic,image/jpeg,image/png,image/heic" className="sr-only" onChange={(event) => processFile(event.target.files?.[0])} data-testid="input-photo-upload" />
            <button onClick={() => fileInputRef.current?.click()} data-testid="button-upload-photo" className="group inline-flex h-14 items-center gap-3 rounded-xl bg-primary px-6 font-bold text-secondary shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg active:translate-y-0"><Upload className="h-5 w-5 transition-transform group-hover:-translate-y-0.5" /> Choose your photo <span className="ml-1 text-secondary/55">/</span><span className="font-mono text-[9px] uppercase tracking-[.12em] text-secondary/70">JPG PNG HEIC</span></button>
            <p className="mt-3 font-mono text-[9px] uppercase tracking-[.12em] text-primary/45">No login. No feed. Just your frame.</p>
          </div>
          {state === 'error' && error ? <div className="mt-7 max-w-md"><ErrorNotice message={error} onDismiss={() => { setError(''); setState('idle'); }} /></div> : null}
        </div>
        <div className="animate-rise-in-delay">
          <ExampleFrame />
          <div className="mx-auto mt-5 flex max-w-[340px] items-center justify-between font-mono text-[9px] font-bold uppercase tracking-[.14em] text-primary/45"><span>Example mark / 01</span><span className="flex items-center gap-1.5"><span className={`h-1.5 w-1.5 rounded-full ${health.isError ? 'bg-accent' : health.isLoading ? 'bg-secondary' : 'bg-primary'}`} /> {health.isError ? 'Frame lab offline' : health.isLoading ? 'Checking frame lab' : 'Frame lab online'}</span></div>
        </div>
      </section>
    );
  };

  return (
    <div className="grain min-h-[100dvh] overflow-hidden bg-background">
      <BrandHeader />
      <main className="relative mx-auto max-w-6xl px-5 pb-16 pt-10 sm:px-8 sm:pt-16 lg:pb-24 lg:pt-24">
        <div className="pointer-events-none absolute -right-28 top-12 h-64 w-64 rounded-full border-[34px] border-secondary/20 sm:-right-8 sm:top-20" />
        <div className="pointer-events-none absolute -left-36 bottom-8 h-72 w-72 rounded-full border-[24px] border-accent/10" />
        {renderMain()}
      </main>
      <footer className="mx-auto flex max-w-6xl flex-col gap-3 border-t border-primary/10 px-5 py-6 font-mono text-[9px] font-bold uppercase tracking-[.14em] text-primary/45 sm:flex-row sm:items-center sm:justify-between sm:px-8">
        <span>Hackers House Goa / 2026</span><span>Made for the people who make things</span>
      </footer>
    </div>
  );
}

function SharedPage() {
  const params = useParams<{ id: string }>();
  const id = params.id ?? '';
  const [imagePath, setImagePath] = useState('');
  useEffect(() => {
    let stored = '';
    try { stored = window.localStorage.getItem(`hh-goa-share-${id}`) ?? ''; } catch { stored = ''; }
    setImagePath(stored || `/api/shares/${encodeURIComponent(id)}/image`);
    document.title = 'A builder is in Goa — HH Goa 2026';
    return () => { document.title = 'HH Goa 2026 — Frame in Goa'; };
  }, [id]);
  const imageUrl = imagePath ? absolutePath(imagePath) : '';
  return (
    <div className="grain min-h-[100dvh] bg-primary text-cream">
      <div className="mx-auto flex min-h-[100dvh] max-w-5xl flex-col px-5 py-6 sm:px-8">
        <header className="flex items-center justify-between">
          <Link href="/" data-testid="link-shared-home"><img src={logoWordmark} alt="Hackers House" className="h-9 w-[145px] rounded-[2px] object-cover object-center" /></Link>
          <span className="font-mono text-[9px] font-bold uppercase tracking-[.16em] text-secondary">Shared frame / {id.slice(0, 8)}</span>
        </header>
        <main className="grid flex-1 items-center gap-10 py-12 lg:grid-cols-[minmax(0,1fr)_330px]">
          <div className="animate-rise-in mx-auto w-full max-w-[620px] rounded-[2rem] bg-secondary p-3 shadow-lg sm:p-5"><div className="rounded-[1.5rem] bg-primary p-2">{imageUrl ? <img src={imageUrl} alt="A shared HH Goa 2026 profile frame" data-testid="img-shared-frame" className="aspect-square w-full rounded-[1.1rem] object-contain" /> : <div data-testid="status-shared-loading" className="aspect-square animate-pulse rounded-[1.1rem] bg-primary/70" />}</div></div>
          <div className="animate-rise-in-delay"><span className="mono-label text-secondary">Someone built here</span><h1 className="mt-4 font-serif text-5xl font-black leading-[.9] tracking-[-.07em] text-cream sm:text-6xl">A face<br />from Goa.</h1><p className="mt-6 text-sm leading-6 text-cream/70">This is a Hackers House Goa 2026 frame — a little signal from the builder community.</p><Link href="/" data-testid="link-make-your-frame" className="mt-8 inline-flex h-14 items-center gap-3 rounded-xl bg-secondary px-6 font-bold text-primary transition-transform hover:-translate-y-1">Make your frame <ArrowUpRight className="h-5 w-5" /></Link></div>
        </main>
        <footer className="border-t border-cream/15 py-5 font-mono text-[9px] font-bold uppercase tracking-[.14em] text-cream/45">Frame in Goa / HACKERS HOUSE / 2026</footer>
      </div>
    </div>
  );
}

function Router() {
  return <Switch><Route path="/" component={Home} /><Route path="/s/:id" component={SharedPage} /><Route component={NotFound} /></Switch>;
}

function App() {
  return <QueryClientProvider client={queryClient}><Router /></QueryClientProvider>;
}

export default App;
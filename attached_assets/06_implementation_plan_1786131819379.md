# Full End-to-End Implementation Plan — HH Goa 2026 Frame Generator

## 0. Prerequisite (blocking)
Get the actual HH Goa 2026 brand assets before writing any UI code: logo, colors, any existing frame/badge design language, and the exact caption copy they want pre-filled in the tweet. Building against guessed branding and redoing it later is wasted time you don't have. If assets aren't provided, request them or make one clearly-labeled placeholder pass and flag it as provisional.

## Phase 1 — Setup (Day 1, ~1–2 hrs)
- [ ] Init Next.js 14 (App Router) + TypeScript + Tailwind
- [ ] Set up Vercel project, connect repo, confirm deploy pipeline works with a placeholder page (deploy early — verify the "live link" requirement is satisfied from hour one, not hour 23)
- [ ] Add Vercel Blob (or R2) storage, wire up env vars
- [ ] Install `heic2any`, `sharp` (server route only)

## Phase 2 — Core compositing engine (Day 1–2, highest priority)
- [ ] Design/obtain the frame PNG asset (transparent center, branded border) at fixed canvas dimensions (e.g., 1000×1000)
- [ ] Build the canvas compositing function: load image → center-crop-to-fit slot → clip → draw frame on top → flatten
- [ ] Test with a deliberately messy set of inputs: portrait photo, landscape photo, square photo, very small photo, very large (12MP) photo — confirm no distortion, no clipping errors
- [ ] Build HEIC detection + client-side conversion path
- [ ] Build server-side HEIC fallback route, test by forcing client conversion to fail

**This phase is the core risk of the whole project — get it rock-solid before touching UI polish.**

## Phase 3 — Upload/Result UI (Day 2)
- [ ] Landing screen: upload CTA, example frame preview, brand styling
- [ ] Wire file input (with camera capture support) → validation (type/size) → compositing pipeline
- [ ] In-place processing state (skeleton/progress inside frame slot, not full-page spinner)
- [ ] Result screen: final image render, Download button (canvas.toBlob → anchor download)
- [ ] Error states for every failure path identified in the webapp flow doc (bad file type, oversized, compositing failure)

## Phase 4 — Share flow (Day 2–3, second highest risk)
- [ ] `/api/upload` route: receive blob, validate, store, return share ID
- [ ] `/s/[id]` server-rendered page with correct `og:image`/`og:title` meta tags
- [ ] Wire "Share to X" button: upload result → construct intent URL with caption + `#FrameInGoa` + share link → open in new tab
- [ ] **Critical test:** paste the actual generated `/s/[id]` URL into Twitter/X's Card Validator (or just post a real test tweet from a throwaway account) to confirm the image preview renders — do not assume OG tags "just work," X's crawler is picky about cache and meta tag placement. Test this early, not the night before submission.

## Phase 5 — Mobile QA pass (Day 3)
- [ ] Real device test on iOS Safari (HEIC is the main risk here) and Android Chrome
- [ ] Confirm upload-to-result timing meets the <3s target on a throttled 4G profile (Chrome DevTools network throttling)
- [ ] Confirm no login/signup surface appears anywhere in the flow
- [ ] Confirm download actually saves a usable PNG file on both iOS and Android (mobile download behavior is a common silent failure point)

## Phase 6 — Polish + submission (Day 3–4)
- [ ] Final brand pass: confirm frame design reads as "unmistakably this event," not a generic ring — sanity check against the PRD's explicit "not a generic badge" requirement
- [ ] Accessibility pass: contrast, alt text, keyboard nav on upload
- [ ] Set storage retention/lifecycle rule
- [ ] Final deploy, smoke test the live link end-to-end exactly as a reviewer would (fresh incognito session, real phone, real photo)
- [ ] Submit live link per task's "What to submit" section

## Explicit non-goals for this timeline (write these down so they're a decision, not a drift)
- Format B (ID Card) — only attempt if Phases 1–6 are done early with time to spare
- Manual crop/reposition UI — only if auto-fit is visibly failing on common photo shapes during QA
- Multiple frame style variants
- Any form of user accounts, saved history, or analytics dashboard

## Biggest risk ranking (in order, so you know where to spend debugging time if things slip)
1. X link preview not rendering the correct image (OG tag / crawler caching issues) — this silently breaks the single most-checked requirement in the brief.
2. HEIC handling failing on real iPhones — the brief explicitly calls this out as required, and it's the most common source of "works on my machine, breaks on reviewer's phone."
3. Off-center/odd-aspect-ratio photos looking bad in the frame — cosmetic but explicitly named as a requirement ("don't assume users will crop first").
4. Mobile download not actually saving a file — easy to overlook if you only test on desktop.

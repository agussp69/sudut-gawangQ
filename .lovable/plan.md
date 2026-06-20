
# Sudut Gawang — Premium Jersey Landing Page

A single-page, Swiss-design inspired landing page for an original football jersey store. Grass green + white palette, modern sans-serif typography, modular grid, generous whitespace, conversion-focused.

## Scope

One-page marketing site built as the home route (`src/routes/index.tsx`). No backend, no cart logic — this is a presentation/landing build. CTAs are visual only (or scroll to sections). Product data is hardcoded sample content.

## Design System (tokens in `src/styles.css`)

- **Colors** (oklch equivalents of):
  - `--background` #FFFFFF
  - `--foreground` #111111 (charcoal body text)
  - `--primary` #1B8F4D (grass green — CTAs, badges, accents)
  - `--primary-foreground` #FFFFFF
  - `--secondary` / heading `--accent-deep` #0E4D2A (dark forest green)
  - `--muted` #F4F5F4 (soft gray bg)
  - `--muted-foreground` #6B7280
  - `--border` #E5E7EB
- **Typography**: Inter (loaded via `<link>` in `__root.tsx`), weights 400/500/600/700/800. Single family, hierarchy via weight + size.
- **Radius**: 12px default, 8px small.
- **Shadows**: thin elevation (`0 1px 2px`, `0 8px 24px -12px`).
- Add `--container-max: 1280px`.

## Page Structure (sections, all in `src/routes/index.tsx` with extracted components)

1. **AnnouncementBar** — thin green strip, 4 rotating value props.
2. **Navbar** — sticky, transparent over hero → white + shadow on scroll. Logo left, nav center (Shop, New Arrival, Vintage, Club, National Team, About, Contact), icons right (Search, Wishlist, Cart, Login).
3. **Hero** — 2-col grid. Left: H1 ("Jersey Original untuk Fans Sejati…"), subheadline, primary + secondary CTA, 3 trust indicators. Right: high-res jersey image with Swiss grid line overlay accent.
4. **SocialProof** — horizontal stat strip (10.000+ Pelanggan, 5.000+ Terjual, 4.9/5, 100% Original).
5. **FeaturedCategories** — 6-card grid (Klub, Timnas, Vintage, New Arrival, Training Kit, Jaket) with image, overlay, hover zoom.
6. **WhyChoose** — 3×2 icon card grid (6 reasons).
7. **FeaturedProducts** — 4-col product grid with badge, name, club, season, price, wishlist + cart icons.
8. **BestSeller** — horizontal carousel (shadcn Carousel) with modern arrow nav.
9. **NewArrival** — grid with green "New" badges.
10. **VintageHighlight** — editorial section, dark forest green accent, headline "Legenda Tak Pernah Pudar.", CTA.
11. **AuthenticityTimeline** — 5-step horizontal timeline with icons.
12. **Reviews** — testimonial carousel cards (photo, name, stars, review, product).
13. **FAQ** — shadcn Accordion, 5 questions.
14. **Newsletter** — green full-width band, email input + Subscribe.
15. **FinalCTA** — centered headline + 2 CTAs.
16. **Footer** — 4 columns (Navigasi, Bantuan, Pembayaran, Ekspedisi) + bottom row with copyright, legal links, social icons.

## Images

Generate 6–8 images via `imagegen` saved under `src/assets/`:
- Hero jersey shot (premium, green/white tones)
- 6 category tiles (club, national team, vintage, new arrival, training kit, jacket)
- 4 featured product shots
- 3 testimonial portraits

All `<img>` get descriptive alt text. Use `loading="lazy"` except hero.

## Motion & Interaction

- Fade-in on scroll via simple IntersectionObserver hook (`src/hooks/use-reveal.ts`).
- Hover scale on cards (transform + transition).
- Smooth scroll via CSS `scroll-behavior: smooth`.
- Navbar scroll-state via `useEffect` scroll listener.

## SEO

- Route `head()`: title "Sudut Gawang — Jersey Sepak Bola Original" (<60 chars), meta description (<160), og:title/description/type=website, twitter:card=summary_large_image, og:image pointing to hero asset.
- Single H1 in hero. Semantic `<header>`, `<nav>`, `<main>`, `<section>`, `<footer>`.
- JSON-LD `Organization` script in head.

## Files to create/modify

- `src/styles.css` — extend tokens (colors, container var).
- `src/routes/__root.tsx` — add Inter `<link>` tags (preconnect + stylesheet), keep existing shell.
- `src/routes/index.tsx` — replace placeholder; compose all sections; set head meta + JSON-LD.
- `src/components/landing/` — one file per section (AnnouncementBar, Navbar, Hero, SocialProof, FeaturedCategories, WhyChoose, FeaturedProducts, BestSeller, NewArrival, VintageHighlight, AuthenticityTimeline, Reviews, FAQ, Newsletter, FinalCTA, Footer).
- `src/hooks/use-reveal.ts` — scroll reveal hook.
- `src/assets/*.jpg` — generated imagery.

## Out of scope

Real cart/checkout, auth, product detail pages, CMS, backend, payments. All interactions are visual on this landing page.

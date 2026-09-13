# 22X Fund

An Astro rebuild of the 22X Token marketing site — a static, zero-JavaScript-by-default
site with two routes (`/` and `/faq`).

This is a portfolio reproduction, not a live site. Three things enforce that:

- `PortfolioDisclaimer.astro` renders a sitewide banner above the navigation saying so.
  It sits in normal document flow, which is why the navigation uses `sticky top-0`
  rather than `fixed` — a fixed nav would render on top of it.
- The investor call to action in `Notification.astro` is inert text rather than a link.
- In `Navigation.astro`, a `null` `link` renders that item as a disabled `<span>`
  instead of an anchor. "Register Here" and "Login" use it, since both originally
  pointed at live Securitize authorization flows.

No page in the built output contains an `id.securitize.io` URL. The only remaining
reference is the plain company link to `www.securitize.io` in `Team.astro`.

## Stack

| Package            | Version  | Notes                                                    |
| :----------------- | :------- | :------------------------------------------------------- |
| `astro`            | ^7.3.2   | Static output, no adapter                                 |
| `tailwindcss`      | ^4.3.3   | Configured in CSS — see [Theming](#theming)                |
| `@tailwindcss/vite`| ^4.3.3   | Tailwind's Vite plugin, wired via `astro.config.mjs`       |
| `@astrojs/check`   | ^0.9.10  | Runs as part of `npm run build`                            |
| `typescript`       | ^6.0.3   | See [Why TypeScript 6](#why-typescript-6)                  |

Requires **Node.js >= 22.12.0** (`astro@7`'s declared engine).

## Commands

All commands are run from the root of the project:

| Command                   | Action                                           |
| :------------------------ | :----------------------------------------------- |
| `npm install`             | Installs dependencies                            |
| `npm run dev`             | Starts local dev server at `localhost:4321`      |
| `npm run build`           | Type-checks, then builds to `./dist/`            |
| `npm run preview`         | Preview the production build locally             |
| `npm run astro ...`       | Run CLI commands like `astro add`, `astro check` |

Note that `npm run build` runs `astro check` first, so a type error fails the build.

## Project structure

```text
/
├── public/                 static assets served as-is (favicon, decorative SVGs)
├── src/
│   ├── assets/             images processed by astro:assets (companies, logos, team)
│   ├── components/         page sections — Hero, Investors, Team, FAQ pieces, …
│   ├── layouts/
│   │   └── Layout.astro    the single layout; imports the global stylesheet
│   ├── pages/              index.astro, faq.astro — one route per file
│   └── styles/
│       └── global.css      Tailwind entry point and design tokens
├── astro.config.mjs
└── tsconfig.json
```

Images under `src/assets/` are pulled in with `import.meta.glob` and rendered through
`astro:assets`, so they get hashed, resized and converted to WebP at build time. Files in
`public/` are copied verbatim and referenced by root-absolute path (`/icon-linkedin.svg`).

## Theming

There is **no `tailwind.config.mjs`**. Under Tailwind 4 the theme lives in CSS, in
`src/styles/global.css`:

```css
@import "tailwindcss";

@theme {
  --color-pickled-bluewood: #2c3b50;
  --color-dodger-blue: #2faeff;
  /* … */
  --text-2xs: 0.5rem;
}
```

Every custom property in `@theme` generates the matching utilities — `--color-viking`
gives you `bg-viking`, `text-viking`, `border-viking`, and also exposes
`var(--color-viking)` for use in hand-written CSS.

Tailwind 4 scans source files for class names automatically, so there is no `content`
glob to maintain. The tradeoff is that class names must be complete static strings —
don't build them by concatenation.

### Using `@apply` in a component

Astro compiles each component's `<style>` block in isolation, so it cannot see the theme.
Any block using `@apply` needs a `@reference` to the global stylesheet first:

```astro
<style>
  @reference "../styles/global.css";

  .profile-name {
    @apply relative;
  }
</style>
```

Without it the build fails with `Cannot apply unknown utility class`. `@reference` only
imports the theme for lookup — it does not duplicate any CSS into the output. Reaching
for `var(--color-…)` directly is usually simpler than `@apply` and avoids the ceremony.

## Notable configuration

### `compressHTML: true`

Astro 7 changed the default to `'jsx'`, which strips whitespace between inline elements.
That silently ate the spaces in markup like `Website: <a href="…">…</a>`, rendering it as
`Website:www.22Xfund.com`. Setting `compressHTML: true` keeps the previous whitespace
handling. Remove the line if the markup is ever reworked to not depend on it.

### Why TypeScript 6

TypeScript 7 is released, but `@astrojs/check` declares a peer range of
`^5.0.0 || ^6.0.0`. TypeScript stays pinned to 6.x until that widens.

## Rendering changes from the Tailwind 3 → 4 upgrade

Two Tailwind 4 behaviour changes are visible on the rendered site. Both are Tailwind
honouring markup that version 3 silently ignored, so the markup was left as written:

- **`leading-*` now beats a responsive `text-*`.** In v3, `md:text-base` overrode
  `leading-loose` at desktop widths because the media-query rule came later in the
  stylesheet. In v4, `text-*` respects the `--tw-leading` variable that `leading-*` sets,
  so `leading-loose` applies at every breakpoint. The FAQ page is ~500px taller as a
  result. To restore the old look, drop `leading-loose` from the answer blocks in
  `src/pages/faq.astro` (and `leading-none` from the hero heading).
- **`space-y-*` moved its margin.** The selector changed from
  `> :not([hidden]) ~ :not([hidden])` (margin-top) to `> :not(:last-child)`
  (margin-bottom), which adds a trailing gap below the last child. Swapping those
  containers to `gap-*` on a flex parent removes it.

Everything else renders pixel-for-pixel identically at 1440px and 390px widths, verified
by screenshot comparison against the pre-upgrade build.

## Deployment

Hosted on Netlify as the `22xfund-work` project, under the same
`*.work.furioursus.dev` convention as the other work-sample sites.

`netlify.toml` holds the build settings, so a Netlify project linked to this
repository needs no configuration in the dashboard:

```toml
[build]
  command = "npm run build"
  publish = "dist"
```

`NODE_VERSION` is pinned to 22 there for the same reason CI pins it — Astro 7's
engine floor is 22.12.0, and Netlify's default image may be older.

Because the build command is `astro check && astro build`, a type error fails the
deploy rather than shipping a broken build.

## Known issues

These predate the upgrade and are unchanged by it:

- `src/assets/companies/KoinbrosLogo.png` is 5278×2771 — roughly 12× the display size of
  every other company logo, and by far the slowest asset to process at build time.
- `max-w-8xl` is used on eight section containers but is not defined in the theme, so it
  emits no CSS. Either define `--container-8xl` in `@theme` or remove the class.
- `tracking-extra-wide` in `src/components/CompaniesCard.astro` is likewise undefined.
- `.faq-item`, `.faq-question` and `.faq-answer` in `src/pages/faq.astro` are dead — the
  markup applies those utilities inline instead.

## Learn more

See the [Astro documentation](https://docs.astro.build) and the
[Tailwind CSS documentation](https://tailwindcss.com/docs).

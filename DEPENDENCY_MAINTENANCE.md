# Dependency maintenance

## 2026-09-27 security remediation

### Starting point and outcome

The supplied audit reported 14 vulnerabilities. The owner's subsequent `npm audit fix` reduced that to three (Astro, esbuild, and sharp), but could not cross the declared Astro 5 major-version boundary. Those supplied failures were treated as the baseline, not rerun for confirmation.

At the start of this work, `package.json` declared `astro: ^5.13.4` and `cwebp: ^3.2.0`; the installed versions were Astro 5.18.2 and cwebp 3.2.0. After upgrading the direct framework dependency with the official upgrader, a clean `npm ci` and `npm audit` reported **0 vulnerabilities**. This is an npm advisory-database result at maintenance time, not a guarantee against undisclosed vulnerabilities.

Environment verified: macOS arm64, Node 22.22.3, npm 10.9.8. The manifest now declares Astro's Node `>=22.12.0` and npm `>=9.6.5` requirements. Deployment builders must also satisfy them; no remote deployment was performed or verified.

### Direct dependencies first

| Direct dependency | Before: declared / installed | After: declared / installed | Decision |
| --- | --- | --- | --- |
| astro | ^5.13.4 / 5.18.2 | ^7.3.5 / 7.3.5 | Upgrade to the current stable release using `@astrojs/upgrade@0.7.5`. |
| cwebp | ^3.2.0 / 3.2.0 | ^3.2.0 / 3.2.0 | npm registry confirmed this is still current; no reported npm vulnerability requires a change. |

No `overrides`, forced transitive major versions, audit suppression, or `npm audit fix --force` were used. `package-lock.json` records the resolved tree. The documented image-preparation workflow invokes an external `cwebp` executable; npm audit does not establish that executable's security or version. That workflow was not changed or exercised.

### Transitive vulnerability tracking

“Before” is the installed tree **after the owner's initial audit fix**, not the older tree from the first audit. Every package named in either supplied report is accounted for below. Already-fixed transitives were retained or replaced by the new framework tree.

| Package | Before | After | Dependency path / disposition |
| --- | --- | --- | --- |
| astro | 5.18.2 | 7.3.5 | Direct upgrade; remaining critical finding cleared. |
| esbuild | 0.27.7; 0.25.9 under Vite | 0.28.2 | Astro and Vite share the patched version. |
| sharp | 0.34.5 | 0.35.5 | Astro; remaining high findings cleared. |
| defu | 6.1.7 | 6.1.7 | Astro → unstorage → h3. |
| devalue | 5.9.4 | 5.9.4 | Astro. |
| diff | 8.0.4 | 9.0.0 | Astro. |
| h3 | 1.15.11 | 1.15.11 | Astro → unstorage. |
| js-yaml | 4.3.2 | 4.3.2 | Astro and its internal helpers. |
| mdast-util-to-hast | 13.2.1 | 13.2.1 | Now present through Astro → shiki → @shikijs/core → hast-util-to-html. |
| nanoid | 3.3.19 | 3.3.19 | Astro → Vite → PostCSS. |
| picomatch | 2.3.2; 4.0.7 | 2.3.2; 4.0.7 | 2.x through unstorage → anymatch; 4.x through Astro and glob tooling. Both retained versions are outside the reported affected ranges. |
| postcss | 8.5.28 | 8.5.28 | Astro → Vite. |
| rollup | 4.63.5 | Removed | No longer present in the inspected dependency tree after Vite 8 migration. |
| smol-toml | 1.9.0 | 1.9.0 | Astro and its internal helpers. |
| vite | 6.4.3 | 8.3.1 | Updated through Astro, not independently overridden. |

Commands used to inspect ownership and resolution:

```sh
npm ls --depth=0
npm ls astro cwebp esbuild sharp defu devalue diff h3 js-yaml mdast-util-to-hast nanoid picomatch postcss rollup smol-toml vite
npm audit
```

On this machine, npm 10.9.8 labeled several optional native/WASM support packages as `extraneous` even immediately after `npm ci`: `@img/sharp-wasm32`, `@emnapi/core`, `@emnapi/runtime`, `@emnapi/wasi-threads`, `@napi-rs/wasm-runtime`, `@tybys/wasm-util`, and `tslib`. `npm explain` confirmed the labels for sharp-wasm32 and emnapi/core but did not establish the cause. Installation, audit, build, and native sharp processing all succeeded. Do not misreport `npm ls --depth=0` as an entirely label-free tree or add these packages as direct dependencies merely to silence the labels.

### Breaking changes researched and code decisions

Primary references:

- [Astro 6 migration guide](https://docs.astro.build/en/guides/upgrade-to/v6/)
- [Astro 7 migration guide](https://docs.astro.build/en/guides/upgrade-to/v7/)
- [Astro CLI reference](https://docs.astro.build/en/reference/cli-reference/)

Changes applied:

1. **Removed `ViewTransitions` API:** replaced the import and component with `ClientRouter` in `src/layouts/Layout.astro`. Kept the existing fade animation and theme lifecycle handling.
2. **Removed automatic legacy content support:** removed `src/content/config.ts`. It declared a projects collection, but there are no project content files and no collection consumers. The baseline dev server warned that `src/content/projects/` did not exist. Deleting this obsolete template configuration avoids enabling compatibility flags or creating an unused loader. If collections are intentionally added later, use `src/content.config.ts`, a Content Layer loader, and `z` from `astro/zod`.
3. **Changed HTML whitespace default:** set `compressHTML: true` in `astro.config.mjs`, preserving the old HTML-aware spacing rather than adopting Astro 7's default JSX whitespace rules. Desktop appearance and footer text were compared with the baseline.
4. **Runtime requirements:** declared Node/npm engines and documented them in the README.

Astro 6/7 also upgrades Vite, Zod, the compiler, and Markdown processing. This project has no custom Vite plugins, server adapters, middleware, database integration, Markdown content, or remark/rehype plugins to migrate. The production build verified that the existing Astro templates compile under the stricter Rust compiler. No legacy Markdown processor was added.

### What worked and what did not

- **Worked:** research the two major-version migration guides, inspect application usage, then upgrade the owning direct dependency. This resolved the remaining transitives without overrides.
- **Insufficient:** the owner's ordinary `npm audit fix` could not upgrade Astro outside `^5.13.4`. Repeating it would not address the major-version compatibility work.
- **Official upgrader:** `npx --yes @astrojs/upgrade@0.7.5 --help` exposes `--dry-run`. The dry run still asks for confirmation of breaking changes. `npx --yes` approves fetching the tool; it does **not** answer the tool's own major-upgrade prompt. An initial foreground interactive invocation timed out at that prompt without changing the manifest. Running it in an interactive session and explicitly accepting the researched major upgrade succeeded.
- **Upgrader boundary:** the tool updated dependency declarations and installation; application migration decisions still needed manual work.
- **Lockfile synchronization:** after adding engines, ran `npm install --package-lock-only`, then `npm ci`. Preserve the generated lockfile rather than hand-editing transitive resolutions.
- **Browser synchronization:** waiting only for the new URL, or even `astro:page-load`, was too early to click through the active view-transition animation. Early smoke assertions incorrectly suggested a broken toggle. Waiting for page load and `document.getAnimations()` completion before clicking verified that client navigation and the theme toggle work. No application workaround was added for a test timing race.
- **Server cleanup:** the observed Astro 7 CLI launched background dev/preview processes. A launcher exiting did not mean the HTTP server had stopped. Used `npm run astro -- dev stop` and `npm run astro -- preview stop` to terminate the validation servers.

### Validation performed

- `npm ci`: successful fresh installation from the committed lockfile.
- `npm audit`: **found 0 vulnerabilities**.
- `npm ls` inspection: verified the direct versions and transitive paths listed above.
- `npm run build`: successful static output; `/index.html`, `/posts/index.html`, and `/404.html` generated.
- Production preview in Chromium:
  - Home heading, all eight artwork images, and footer text verified; desktop appearance compared with Astro 5 baseline.
  - Light/dark toggle and stored preference after reload verified; screenshots inspected in both themes.
  - Posts page rendered all six cards, all images loaded, and external destinations remained Medium/YouTube. External services were not exercised.
  - Clicking the portfolio navigation from Posts preserved a window marker and completed Astro's client-navigation lifecycle. Theme toggle and localStorage remained functional after the transition completed.
  - A nonexistent route returned HTTP 404 with the custom page and loaded image; Return Home worked.
  - Mobile home inspected at 390 × 844; see the existing layout limitation below.
  - No JavaScript errors observed in the checked production interactions.
- Upgraded development server: home loaded in Chromium and theme state matched localStorage; no JavaScript errors observed.
- Native image smoke: sharp 0.35.5 / libvips 8.18.7 converted `public/li-in.png` in memory to a 16px-wide WebP, then decoded metadata confirmed the format and width. This exercises the upgraded native dependency even though the site serves preprocessed images.
- Browser tabs and validation servers closed. No permanent test framework or throwaway scripts were added.

### Existing limitation found during validation

At a 390px viewport, the home document has a 420px scroll width. The seven gallery images retain the original `width="400"` attributes in `src/pages/index.astro`, while the unchanged mobile CSS sets the body to 350px. These images extend to x=420. This pre-existing source-level sizing mismatch was left outside the dependency-remediation scope; mobile overflow is **not** a passing validation claim.

### Next maintenance procedure

1. Use a supported Node release meeting the manifest engines, including in the deployment builder. Install with `npm ci`.
2. Inspect `npm outdated`, `npm audit`, and `npm ls --depth=0`. Track vulnerable packages back to direct owners with `npm explain` or targeted `npm ls`.
3. Research release notes for every crossed major. For Astro, prefer the official upgrader, inspect its dry run, and deliberately accept its migration prompt.
4. Update application APIs and runtime requirements alongside the manifest and lockfile. Avoid broad `--force` upgrades or transitive overrides as a substitute for compatibility work.
5. Run a fresh install, audit, targeted dependency-tree inspection, and production build. Repeat browser checks for home, images, both themes, reload persistence, client navigation, posts, and 404; wait for animations before interaction assertions.
6. Record exact versions, advisory outcomes, failures, limitations, and successful checks here. A clean audit alone does not prove the application still works.

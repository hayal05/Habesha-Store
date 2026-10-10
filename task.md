# Habesha Store: UI/UX Tasks (Section 21)

Source: Section 21, Industry-Grade UI/UX Design Requirements.

**Goal:** A polished, production-ready app marketplace (public store plus developer dashboard, no admin) with one consistent design system, in roughly 1,800-2,600 lines of application code.

**UI reference:** `reference/ui-mockup.png` (see `reference/README.md` for what to follow and what to skip).

**Rules that apply to every task**
- Real database data only. No fake data and no fabricated download progress.
- One design system across all pages (CSS variables / tokens).
- Do not imply an arbitrary IPA can be installed from Google Drive.
- Do not add an admin dashboard.
- Never sacrifice functionality, security, accessibility, or maintainability to hit the line count.

Status key: `[ ]` not started, `[~]` in progress, `[x]` done

Sub-tasks (e.g. 18.1) are tracked inside their parent; the 24-task progress count only changes when the parent is marked done.

---

## Phase 1: Foundation

- [x] 1. Define design tokens: brand and neutral colors, type scale, font weights, spacing scale, radii, borders, shadows, breakpoints
- [x] 2. Create logo, favicon, and a subtle Ethiopian-inspired accent
- [x] 3. Base styles: reset, typography, visible focus rings, reduced-motion rules

## Phase 2: Reusable Components

- [x] 4. Buttons (primary, secondary, ghost, danger), platform badges (Android/iOS), form fields (label above input, required marker, inline validation, password toggle)
- [x] 5. Header: logo, prominent search, Android/iOS filter, developer sign-in/publish link, compact mobile nav
- [x] 6. App card: fixed icon ratio, controlled name wrapping, truncated description, developer name, platform badge, subtle action, image-failure fallback
- [x] 7. Skeleton loaders (only where they help), toast notifications, empty states, error messages
- [x] 8. Upload areas for app icon and screenshots

## Phase 3: Public Store

- [x] 9. Homepage: compact intro, categories, popular (from real download data), recent/updated, featured (only if real data exists), responsive grid
- [x] 10. Search and filter results, including the no-results state
- [x] 11. App details page: icon, name, developer, platform, distribution type, version, primary action (Download APK / Get on App Store / Join TestFlight), summary and full description, touch-friendly screenshot gallery, compatibility, last updated, file size, report-listing action
- [x] 12. Mobile sticky action bar that never hides content
- [x] 13. States: unpublished app, unavailable Google Drive file, download started, download completed (only if verifiable), external download fallback

## Phase 4: Auth and Developer Dashboard

- [x] 14. Sign-in / sign-up screens: inline validation, loading, success, error, disabled states
- [x] 15. Dashboard shell: compact sidebar on desktop, drawer on mobile, page title with supporting text, prominent Publish App action
- [x] 16. Overview: published app count and recorded download clicks
- [x] 17. App list: icon, name, platform, version, status, last updated, action menu (Edit, Update, Unpublish)
- [x] 18. Publish/edit form: logically grouped fields, compact layout (no card per field), success and failure states
    - [x] 18.1 Decide where icons and screenshots are stored: local disk in `UPLOAD_DIR`, served by a route (decided 2026-10-10); unblocks 18.5 and 18.6
    - [x] 18.2 Page scaffolds: `/dashboard/apps/new` and `/dashboard/apps/[id]/edit` inside `DashboardShell` (`publish={false}`), guarded by `requireDeveloper()`; edit loads the app with `getOwnApp()` and, if it is missing or not theirs, redirects to the list with the existing "missing" notice (form slot still empty until 18.3)
    - [x] 18.3 Shared form component: compact grouped sections (basics, description, distribution, release, media), no card per field, reuse existing field styles (`components/AppForm.js`; posts multipart to `/api/apps/save`)
    - [x] 18.4 Release section with `id="release"` (version, download link, file size): the "Update version" jump target from the app list (anchor is already on the section from 18.3; only the jump check from the list menu is left); checked at 375/768/1280px: the section heading lands below the sticky bar
    - [x] 18.5 Icon upload: server-side checks and storage in `lib/uploads.js` (type from the file's bytes, size, 512px minimum, square, 8000px maximum, random names in `UPLOAD_DIR`), served by `app/uploads/[name]/route.js`; the save route calls it in 18.7
    - [x] 18.6 Screenshot rules: at most 8 in total (kept + new), only the app's own screenshots can be removed, kept ones keep their order and new ones go last, files of removed ones are deleted after the save (`checkScreenshotCount`, `applyScreenshots`, `saveImages`; the save route calls them in 18.7/18.8)
    - [x] 18.7 Create route: POST, same-origin check, validation matching client messages, insert scoped to the developer, redirect to the app list with an allow-listed notice (one shared route, `POST /api/apps/save`, shared with 18.8; `lib/publish.js` `parseApp`, `saveApp` in `lib/queries.js`)
    - [x] 18.8 Update route: owner-only update in SQL, applies removed screenshots, sets `updated_at` on content edits only (may share one route with 18.7)
    - [x] 18.9 Client behaviour in `ui.js`: inline validation, loading and disabled state, failure alert; form still works without JS (the auth form block now serves `[data-app-form]` too)
    - [x] 18.10 Success and failure states: redirect notices, error alert keeps the form filled in, signed-out case (`components/Notice.js`, `FORM_ERRORS` in `lib/publish.js`); the click-through in a real `npm run dev` is still to be done by you (see project-status Risks)
- [x] 19. Session-expired handling: sign-in screen warning only for a stale session, return to the page the person was on, an open publish form keeps its input (`signInPath`, `expiredPath`, `requireDeveloper` in `lib/auth.js`; 401 branch in ui.js)

## Phase 5: Quality Pass

- [x] 20. Accessibility audit: semantic HTML, keyboard navigation, contrast, alt text, accessible names, touch targets, no hover-only interactions
    - [x] 20.1 Automated: axe-core (WCAG 2.0/2.1/2.2 A and AA plus best-practice) on 16 pages at 375 and 1280px, signed in and out: 0 violations after the fixes below
    - [x] 20.2 Keyboard: every tab stop on every page has a visible focus ring and is not covered by a fixed element; dashboard drawer keeps focus inside (main is `inert` while open), Escape and scrim click close it and focus returns to the menu button
    - [x] 20.3 Fixes: heading order on search results, banner landmark for the mobile dashboard bar, platform filter no longer reloads the page on arrow keys (mouse/touch auto-submit stays, Enter submits for keyboard), 3:1 border for inputs, search field and upload areas (`--color-control-border`), "View all" target size, "opens in a new tab" for the session-expired Sign in link
    - [x] 20.4 Reflow and resize: no horizontal overflow at 320px; 200% text size at 640px is clean on every page
- [x] 21. Responsive review of every page on mobile, tablet, desktop: no horizontal overflow, no overlap, no distorted icons, nothing hidden behind fixed elements
    - [x] 21.1 14 pages/states (home, search with results / no results / empty category, details for a long name / TestFlight / unpublished, download-unavailable, report, 404, dashboard overview, list, new, edit) at 375, 768 and 1280px in a real browser: no horizontal overflow, no clipped text, icons square, no distorted images, mobile action bar never covers the report link (27px clear at page end); screenshots reviewed by eye. No code changes were needed
- [ ] 22. Stress test: long app names, missing screenshots, empty categories, large listing counts
- [x] 23. Remove placeholders, broken links, decorative filler, and unfinished UI; confirm all UI is driven by database data
    - [x] 23.1 Code review (not a browser run): every internal link points at an existing route; no lorem/TODO/fake data; home, search, details and dashboard read the database (empty states otherwise). Fixed: the web manifest pointed at `/icon-192.png` and `/icon-512.png`, which only exist under `/brand/`, so both 404ed (both manifests now use `/brand/...`); `styleguide.html` was publicly served with `href="#"` stubs, so it moved to `store/dev/` (links to `../public/`)
- [x] 24. Check code size against the 1,800-2,600 line target without cutting functionality
    - [x] 24.1 Measured: 1,997 lines of JS (`app/`, `components/`, `lib/`, `ui.js`) is inside the target; the 1,384 lines of CSS are on top, 3,381 together (2,930 without blanks and comments). Nothing cut: the spec says never to trade functionality, security or accessibility for line count. Decision for you: treat the target as JS only (done) or cut CSS

---

## Suggested Order

1. Phases 1 and 2 first (everything reuses them)
2. Homepage and app details page (most important screens)
3. Auth and dashboard
4. Quality pass last

## Final Visual Standard

Habesha Store should look like a coherent, professionally designed digital product ready for real users. Quality comes from hierarchy, spacing, consistency, and polished interactions, not from extra features or extra code.

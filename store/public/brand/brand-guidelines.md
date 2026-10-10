# Habesha Store: Brand Guidelines

## Logo
- **Mark:** white "H" on Ethiopian green, with a gold crossbar. `logo-mark.svg` (rounded) and `icon-square.svg` (full-bleed, for app icons).
- **Lockup:** mark + "Habesha Store" wordmark. In the UI, build it with the `.logo` class (live text). `logo-horizontal.svg` is for documents and social images only.
- **Minimum size:** mark 24px, lockup 120px wide.
- **Clear space:** at least the width of one "H" bar (about 1/7 of the mark) on every side.
- Do not recolor, stretch, rotate, or add effects.

## Colors
Defined in `tokens.css`: green `--brand-600`, gold `--accent-500`, flag red `--flag-red`.
Flag colors are for the brand stripe and pattern only, never for status or buttons.

## Ethiopian-inspired accents
- `.brand-stripe`: green/gold/red band, once per page.
- `.brand-pattern`: tibeb-style woven diamonds, auth side panel and empty states only.

## Files
| File | Use |
|------|-----|
| `favicon.svg` | Modern browsers |
| `favicon.ico` (16/32/48) | Legacy browsers |
| `apple-touch-icon.png` (180) | iOS home screen |
| `icon-192.png`, `icon-512.png` | Web manifest |
| `site.webmanifest` | Theme color and icons |

## Head snippet
```html
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="icon" href="/favicon.ico" sizes="48x48">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<link rel="manifest" href="/site.webmanifest">
<meta name="theme-color" content="#0B7A43">
```
Copy the icon files to your public web root so these paths resolve.

# Visual style (design note)

Status: agreed on 2026-10-22. Applied from the first screen (block 3) as design tokens.

## Direction

The visual language is inspired by the design of the technical brief: a dark night-sky background, a single amber accent and thin golden orbit lines. This is inspiration, not branding: no logo, company name or tagline from the brief is used. The app is Orbitarium.

## Typography

Read from the fonts embedded in the brief's PDF. Both are Google Fonts, loaded with `next/font/google`.

- **Headings:** Poppins, Medium (500) and SemiBold (600).
- **Body:** Roboto, Regular (400).

## Colour tokens

Measured on the rendered brief pages.

| Token | Value | Use |
|---|---|---|
| `bg-top` | `#190F21` | Top of the vertical background gradient |
| `bg-bottom` | `#09080C` | Bottom of the background gradient |
| `surface` | `#19141F` | Cards and panels |
| `accent` | `#FCB810` | Primary actions, highlights, orbit trails |
| `text-strong` | `#F5F1F8` | Headings |
| `text` | `#C8C1D0` | Body text |
| `text-muted` | `#97919B` | Secondary text (dates, captions) |

## Contrast (WCAG AA requires 4.5:1 for body text)

| Pair | Ratio |
|---|---|
| `text-strong` on `surface` | 16.2:1 |
| `text` on `surface` | 10.3:1 |
| `text-muted` on `surface` | 5.9:1 |
| `accent` on `surface` | 10.3:1 |
| `bg-bottom` (dark text) on `accent` | 11.4:1 |

## Rules

- Dark theme only. Stated in the README as a known limit: a light theme would mean redefining the colour tokens.
- Colours are defined once as CSS variables in the Tailwind theme. No component hardcodes a colour.
- Orbit trails and thumbnails reuse the brief's motif: thin lines in the accent colour.

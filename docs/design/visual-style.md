# Visual style (design note)

Status: agreed on 2026-10-22, design system added on 2026-10-23. Applied through the theme tokens in `src/app/globals.css`.

## Direction

A night sky with gold linework, inspired by the design of the technical brief: a dark violet background, a single amber accent and thin golden orbit lines. This is inspiration, not branding: no logo, company name or tagline from the brief is used. The app is Orbitarium.

**The one memorable element is the orbit linework.** Thin amber paths drawn from the real simulation appear in the logo, the home hero, the gallery thumbnails and the detail canvas. Everything around them stays quiet: flat surfaces, hairline borders, no shadows, no gradient washes beyond the page background, and no decoration that does not carry information.

## Typography

Read from the fonts embedded in the brief's PDF. Both are Google Fonts, loaded with `next/font/google`.

- **Headings:** Poppins, Medium (500) and SemiBold (600).
- **Body:** Roboto, Regular (400).

| Role | Font | Size | Line height | Tracking |
|---|---|---|---|---|
| Display (home hero only) | Poppins 600 | clamp(2.5rem, 2rem + 2.5vw, 3.75rem) | 1.05 | −0.025em |
| Page title (h1) | Poppins 600 | clamp(2rem, 1.6rem + 1.6vw, 2.5rem) | 1.15 | −0.02em |
| Section title (h2) | Poppins 500 | 1.5rem | 1.25 | −0.01em |
| Card title (h3) | Poppins 500 | 1.125rem | 1.3 | 0 |
| Lead | Roboto 400 | 1.125rem | 1.6 | 0 |
| Body | Roboto 400 | 1rem | 1.6 | 0 |
| Small and data | Roboto 400 | 0.875rem | 1.45 | 0 |

Rules: sentence case everywhere, no all-caps labels, no eyebrow labels above headings. Running text is at most 60 characters wide (`max-w-[60ch]`). Numbers use Spanish formatting ("17,33").

## Colour tokens

Measured on the rendered brief pages, plus two derived tokens for structure.

| Token | Value | Use |
|---|---|---|
| `bg-top` | `#190F21` | Top of the vertical page gradient |
| `bg-bottom` | `#09080C` | Bottom of the gradient; recessed plates behind drawings |
| `surface` | `#19141F` | Cards and panels |
| `surface-raised` | `#211A29` | Hovered cards, pressed controls |
| `line` | `#2A2333` | Hairline borders and dividers |
| `accent` | `#FCB810` | Orbit lines, active navigation, primary actions, focus ring |
| `strong` | `#F5F1F8` | Headings, bodies in the simulation |
| `body` | `#C8C1D0` | Body text |
| `muted` | `#97919B` | Secondary text and data |

## Contrast (WCAG AA requires 4.5:1 for body text)

| Pair | Ratio |
|---|---|
| `strong` on `surface` | 16.2:1 |
| `body` on `surface` | 10.3:1 |
| `muted` on `surface` | 5.9:1 |
| `muted` on `surface-raised` | about 5.3:1 |
| `accent` on `surface` | 10.3:1 |
| `bg-bottom` (dark text) on `accent` | 11.4:1 |

## Layout and spacing

- **Spacing:** Tailwind's 4 px scale, used only at 4, 8, 12, 16, 24, 32, 48, 64 and 96 px.
- **Container:** 1120 px wide at most, left-aligned content, gutters of 16 px on mobile, 24 px from 640 px and 32 px from 1024 px.
- **Header:** 64 px tall, a `line` border at the bottom, not sticky.
- **Page rhythm:** 40 px from the header to the page title on mobile and 56 px from 1024 px; 12 px from the title to the lead; 32 px from the lead to the content; 64 px between sections.
- **Grid gaps:** 16 px on mobile, 24 px from 640 px.
- **Radius:** 16 px for cards, 12 px for plates inside cards, 10 px for controls, full for status dots.

## Components

**Header.** Logo mark (28 px) and the wordmark "Orbitarium" (Poppins 600, 1.125rem) on the left, linking home. Navigation on the right: "Galería" and "Aprende", in `body`, turning `strong` on hover. The current section has `aria-current="page"`, `strong` text and a 2 px `accent` underline 6 px below the baseline. A detail page marks "Galería" as current.

**Page header.** The h1 and an optional lead, using the rhythm above. One shared component, so every page starts at the same height.

**Orbit card (gallery).**

```
┌────────────────────────────┐
│ ┌────────────────────────┐ │  plate: bg-bottom, radius 12, aspect 4:3,
│ │      orbit linework    │ │  orbit in accent at 85 % opacity, 1.25 px;
│ │   ·  ·  ·  (3 starts)  │ │  the three bodies' starting points as
│ └────────────────────────┘ │  small strong dots
│ Butterfly I       T = 6,23 │  h3 left, period right in muted small text
│ ● Se deshace sin corrección│  status: 6 px dot + small text
└────────────────────────────┘
```

- Card: `surface`, 1 px `line` border, 12 px padding around the plate, 16 px below it.
- Status: a filled `accent` dot for "Se mantiene sola", a hollow `muted` ring for "Se deshace sin corrección". Both labels are full-strength text: neither should look disabled.
- Hover and focus: the border turns `accent` at 40 % opacity, the background `surface-raised` and the orbit line full opacity. No lift, no shadow, no scaling.

**Links and buttons.** Text links are `accent`. Primary buttons are `accent` with `bg-bottom` text; secondary buttons are `surface` with a `line` border. No arrows appended to link or button text.

**Focus.** A 2 px `accent` ring with a 3 px offset on every interactive element.

**Page titles.** The browser title is "Página | Orbitarium".

## Logo

An apple drawn as an orbit: one continuous amber line traces the outline of an apple, two rounded leaves sit on top, and a small light dot sits on the line, like a body travelling along its orbit. It joins the two halves of the app: Newton's apple (Part A) and the orbits (Part B).

- **Mark** (header, 28 px): the outline at 3 units of a 64-unit box, leaves filled, dot `strong` with a ring of the background colour that cuts the line. Rendered as an inline SVG component using the theme tokens.
- **Icon** (favicon and app icon, `src/app/icon.svg`): the same drawing on a `bg-top` rounded square, with a heavier 5-unit line so it reads at 16 and 32 px.

Path data (64 × 64 box):

- Apple: `M32 21 C35.5 15 49 13.5 53.5 25 C57.5 36.5 51.5 51.5 43.5 54.5 C39.5 56 35.5 54.5 32 54 C28.5 54.5 24.5 56 20.5 54.5 C12.5 51.5 6.5 36.5 10.5 25 C15 13.5 28.5 15 32 21 Z`
- Right leaf: `M33.5 16 C34.5 10 39 6.5 45 7 C44.5 12.5 40 16.5 33.5 16 Z`
- Left leaf: `M30.5 16 C29.5 11.5 26 9 21.5 9.5 C22 13.5 25.5 16.5 30.5 16 Z`
- Body: a circle at (9.3, 36).

## Motion

One orchestrated moment: on the home page, the hero orbit draws itself once on load (about 2.4 s), then its bodies start moving. Everything else moves only in response to the user (the simulation, hover and focus states). With `prefers-reduced-motion: reduce`, the hero shows the finished drawing and the bodies stay still.

## Rules

- Dark theme only. Stated in the README as a known limit: a light theme would mean redefining the colour tokens.
- Colours are defined once as CSS variables in the Tailwind theme. No component hardcodes a colour (enforced by `src/theme.test.ts`).
- Orbit drawings always come from the simulation, never from hand-drawn shapes.

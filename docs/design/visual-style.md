# Visual style (design note)

Status: agreed on 2026-10-22, design system added on 2026-10-23, lesson additions (spec 04) on 2026-10-27. Applied through the theme tokens in `src/app/globals.css`.

## Direction

A night sky with gold linework, inspired by the design of the technical brief: a dark violet background, a single amber accent and thin golden orbit lines. This is inspiration, not branding: no logo, company name or tagline from the brief is used. The app is Orbitarium.

**The one memorable element is the orbit linework.** Thin amber orbit lines appear in the logo, the home hero, the gallery thumbnails and the detail canvas. Everything around them stays quiet: flat surfaces, hairline borders, no shadows, no gradient washes beyond the page background, and no decoration that does not carry information.

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

Tailwind's default sizes stay available next to these roles. The only one in use is `text-xs` (0.75rem), for the lesson's reference badges below 640 px.

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
| `muted` | `#97919B` | Secondary text and data; borders that identify a control |
| `apple` | `#E5484D` | The apples of the lesson's illustrations, nothing else |

`apple` is the one colour outside the night-sky palette: an apple that is not red is hard to read (spec 04).

## Contrast (WCAG AA requires 4.5:1 for body text)

| Pair | Ratio |
|---|---|
| `strong` on `surface` | 16.2:1 |
| `body` on `surface` | 10.3:1 |
| `muted` on `surface` | 5.9:1 |
| `muted` on `surface-raised` | 5.5:1 |
| `accent` on `surface` | 10.3:1 |
| `bg-bottom` (dark text) on `accent` | 11.4:1 |

A border that is what identifies a control needs 3:1 against its background (WCAG 1.4.11). `line` on `surface` is 1.2:1, so it is only for dividers and card borders, and control borders use `muted` (5.9:1).

## Layout and spacing

- **Spacing:** Tailwind's 4 px scale, used only at 4, 8, 12, 16, 24, 32, 48, 64 and 96 px.
- **Container:** 1120 px wide at most, left-aligned content, gutters of 16 px on mobile, 24 px from 640 px and 32 px from 1024 px.
- **Header:** 64 px tall, a `line` border at the bottom, not sticky.
- **Page rhythm:** 40 px from the header to the page title on mobile and 56 px from 1024 px; 12 px from the title to the lead; 32 px from the lead to the content; 64 px between sections.
- **Grid gaps:** 16 px on mobile, 24 px from 640 px.
- **Radius:** 16 px for cards, 12 px for plates inside cards, 10 px for controls, full for status dots.

## Components

**Header.** Logo mark (28 px) and the wordmark "Orbitarium" (Poppins 600, 1.125rem) on the left, linking home. Navigation on the right: "Gravitación" and "Tres cuerpos", in `body`, turning `strong` on hover. The current section has `aria-current="page"`, `strong` text and a 2 px `accent` underline 6 px below the baseline. A detail page marks "Tres cuerpos" as current.

**Page header.** The h1 and an optional lead, using the rhythm above. One shared component, so every page starts at the same height.

**Orbit card (gallery).**

```
┌────────────────────────────┐
│ ┌────────────────────────┐ │  plate: bg-bottom, radius 12, aspect 2:1,
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

**Section card (home).**

```
┌──────────────────────────────────────────────┐
│ ┌──────────┐  La ley de gravitación          │  plate: 224 px wide, 4:3, the
│ │ drawing  │  universal                      │  same for both cards, at the
│ │          │  A line or two of description.  │  top; title (h2, card size)
│ └──────────┘                              →  │  and a line or two; arrow bottom right
└──────────────────────────────────────────────┘
```

- The same card as the gallery's: `surface`, 1 px `line` border, 12 px padding, and the same hover and focus.
- From 640 px the plate sits beside the text; below, it is above the text and 2:1. Both drawings are framed alike, so they come out the same size.
- The text is a title and a line or two, so both cards have the same height. A 24 px arrow sits at the bottom right in `muted`, turning `accent` on hover and focus. It is decorative (`aria-hidden`): the link's name is the title only.

**Links and buttons.** Text links are `accent`. Primary buttons are `accent` with `bg-bottom` text; secondary buttons are `surface` with a `line` border. No arrows appended to link or button text; the home's section cards have one of their own, outside the link's text.

**Lesson controls.** The cannon's number fields, presets, «Borrar trayectorias» and outcome label sit on `surface` with a 1 px `muted` border (see "Contrast").

**Reference badges.** Two pills at the top right of the cannon's canvas: `surface`, a 1 px `muted` border, `body` text in small size with tabular figures; below 640 px `text-xs` and a shorter label.

**Tutor's panel.** From 1,280 px a floating card at the bottom right, set apart from the page by a `surface-raised` background, a 1 px `strong` border and a 12 px radius, with no shadow. Below, a full-width bottom sheet on `surface` with a `muted` top border.

- Header: the title at card size (h3 style), a quiet «Nueva conversación» text button once there are messages, and a 32 px «×» close button with a `muted` border.
- Messages: in small text (0.875 rem, 1.45 line height). The tutor's on the left, on `surface` with a `line` border and a 10 px radius; the learner's on the right, on `line`, lighter than the panel on the sheet and on the card. Action lines are `muted` inside the tutor's message.
- Input: one rounded field on `surface` with a `muted` border, which grows with the text up to about six lines and then scrolls, with «Enviar» as a 32 px icon button (↵) inside it at the bottom right. While the text area has focus, the field's border turns `strong` and 2 px wide (see "Focus").

**Focus.** A 2 px `accent` ring with a 3 px offset on every interactive element. One exception: the tutor's input field, a bordered container with its button inside, shows focus as a 2 px `strong` border instead (`muted` at rest), because an accent ring around the whole field looked heavy; that is still a change of at least 3:1 against the panel.

**Page titles.** The browser title is "Página | Orbitarium".

## Logo

Three amber orbits crossing at the centre: three identical ellipses, rotated 0°, 60° and 120°, with nothing else.

- **Mark** (header, 28 px): ellipses with rx 27 and ry 10 in a 64-unit box, centred, stroke 2 units, in `accent`. Rendered as an inline SVG component using the theme tokens.
- **Icon** (favicon and app icon, `src/app/icon.svg`): the same drawing with no background, so it takes the browser tab's. The stroke is 3 units, not 2, because without a square behind it the fine line gets lost at 16 px. It follows the browser's theme: `accent` on a dark tab, and a darker amber (`#9A6700`, 4.9:1 on white) on a light one.

## Motion

One orchestrated moment: on the home page, the hero orbit draws itself once on load (about 2.4 s), then its bodies start moving. The lesson's two illustrations, `#falling` and `#mutual`, also move on their own: each loops, with a «Pausar»/«Reanudar» button at a corner of its drawing (WCAG 2.2.2). Everything else moves only in response to the user (the simulation, hover and focus states). With `prefers-reduced-motion: reduce`, the hero shows the finished drawing and the bodies stay still, and the two illustrations show their final frame, with no pause button.

## Rules

- Dark theme only. Stated in the README as a known limit: a light theme would mean redefining the colour tokens.
- Colours are defined once as CSS variables in the Tailwind theme. No component hardcodes a colour (enforced by `src/theme.test.ts`).
- Orbit drawings in the hero, thumbnails and canvas always come from the simulation, never from hand-drawn shapes. The logo is the one symbolic exception.

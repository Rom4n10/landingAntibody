---
version: alpha
name: antibody-gram-stain
description: A repository immune system presented as a stained microscope slide — pathology report precision, terminal honesty.
colors:
  primary: "oklch(0.21 0.03 270)"      # Hematoxylin ink
  secondary: "oklch(0.52 0.02 265)"    # Slide graphite — captions, rules
  accent: "oklch(0.58 0.2 15)"         # Safranin — sole interaction driver
  surface: "oklch(0.995 0.002 250)"    # Coverslip
  background: "oklch(0.965 0.006 245)" # Glass slide
  on-background: "oklch(0.21 0.03 270)"
  on-surface: "oklch(0.21 0.03 270)"
  neutralized: "oklch(0.44 0.17 312)"  # Crystal violet — caught mutant
  escaped: "oklch(0.74 0.15 70)"       # Iodine amber — escaped variant
  error: "oklch(0.58 0.2 28)"
  success: "oklch(0.55 0.13 150)"
typography:
  display:  { fontFamily: "Fraunces", fontSize: 88, fontWeight: 800, lineHeight: 0.95, letterSpacing: -0.035em }
  headline: { fontFamily: "Fraunces", fontSize: 48, fontWeight: 700, lineHeight: 1.02, letterSpacing: -0.025em }
  body-lg:  { fontFamily: "IBM Plex Sans", fontSize: 19, fontWeight: 400, lineHeight: 1.55 }
  body-md:  { fontFamily: "IBM Plex Sans", fontSize: 16, fontWeight: 400, lineHeight: 1.6 }
  label:    { fontFamily: "JetBrains Mono", fontSize: 12, fontWeight: 500, letterSpacing: 0.02em }
rounded: { xs: 2px, sm: 4px, md: 8px, lg: 14px, full: 9999px }
spacing: { xs: 4px, sm: 8px, md: 16px, lg: 32px, xl: 64px, 2xl: 144px }
components:
  button-primary: { backgroundColor: "{colors.accent}", textColor: "{colors.surface}", rounded: "{rounded.full}", padding: "14px 22px" }
  button-ghost:   { backgroundColor: "transparent", textColor: "{colors.primary}", border: "1px solid currentColor", rounded: "{rounded.full}" }
  card:           { backgroundColor: "{colors.surface}", rounded: "{rounded.md}", border: "1px solid rule" }
---

## Overview
A Gram-stained slide under a lab microscope. The page reads like a pathology report written by a compiler: heavy serif verdicts, monospaced evidence, hairline rules, and three dyes that each carry meaning. Nothing is decorative — every colour is a stain that tells you what happened to a piece of code.

## Colors
- **Hematoxylin ink:** all text and rules. Never pure black.
- **Safranin (accent):** the only interaction colour — primary CTAs, links, focus, active tabs, the microscope lens ring.
- **Crystal violet:** state only — a variant/twin that was caught. Never used for buttons.
- **Iodine amber:** state only — a variant that escaped.
- **Glass / Coverslip:** page and raised surfaces. Code specimens are always dark ("darkfield") in both themes.
- **Team red / Team blue:** identity only for the two agents in the adversarial self-play section; never used for buttons.
Dark theme is darkfield microscopy: same hues, inverted lightness. The adversarial section is a permanent darkfield band in both themes.

## Typography
Fraunces 700–800 for verdicts (hero, section titles, big numbers) — a scientific-journal voice with weight. IBM Plex Sans for prose (a nod to IBM Bob). JetBrains Mono for anything a machine produced: paths, exit codes, labels, metadata. Scale ≈1.333; fluid clamp() on display and headline.

## Layout
12-column grid, 1240px max, 24px gutters. Sections open with a report header: a hairline rule, a mono "specimen label" on the left rail, and the serif title spanning 8 columns. Section padding 144px desktop / 88px mobile. Asymmetry is the default; centered text only for the closing CTA.

## Elevation & Depth
Flat. Separation is done with hairline rules and surface changes, not shadows. One shadow level ("floating") exists only for the sticky nav and the lens.

## Shapes
Rectangles with 8px radius for panels; 4px for chips; full pills for buttons only; perfect circles for wells, lens, and node markers (they are biological objects).

## Components
Primary button: safranin fill, press scales to 0.97. Ghost button: 1px ink border. Tabs: mono labels, safranin underline when active. Code specimens: darkfield panel with a mono filename bar, no macOS traffic-light dots.

## Do's and Don'ts
**Do:** let stains carry meaning; label evidence in mono; keep one bold moment (the hero lens).
**Don't:** use emoji as icons; add glows or gradients; animate things that are seen repeatedly; use violet for interaction; use `transition: all`; nest cards more than 2 levels; use Inter/Roboto/Space Grotesk/Geist.

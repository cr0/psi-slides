---
title: Advanced styling
subtitle: An accent, a frame, tones, edges, icons and boxes – together
presenter: Christian Roth
contact: https://github.com/UBA-PSI/psi-slides
notice: Built from this one file.
info: |
  A reference lecture
  psi-slides
section: number
theme: light-orange
lang: en
font: sans
collapse: none
auto-fit: true
slide-numbers: off
icons: fontawesome-free
identity:
  accent: "#EC8A3C"
  logo: mark.svg
  logo-place: corner
  footer-left: "Advanced styling · a reference lecture"
  footer-right: "psi-slides"
  logo-print: every
palette:
  tone-1: "#C45A0A"
  tone-2: "#0E6F87"
  tone-3: "#7A4B9C"
style:
  elevation: offset
---

<!-- linter: ignore accent-contrast, tone-contrast -->
<!--
Both ignored on purpose. The accent is the colour the accent reference deck
measures, and tone-2 is the teal the palette reference deck measures: this deck
wears both to show the keys together, and the ink the build reverses onto the
accent is part of what it shows. lectures/identity-accent/ and
lectures/palette/ explain each finding.
-->

## title: {#cover}

# Six keys, one deck {#together-part}

## principle: Each key answers one question {#why}

**Whose deck is this, what do its colours mean, how does a box stand off the
page, what can a word carry, and what is the reader to do?** Every slide in
this deck answers all of them at once.

## definition: The whole frontmatter {.wide #keys}

```yaml
icons: fontawesome-free
identity:
  accent: "#EC8A3C"
  logo: mark.svg
  logo-place: corner
palette:
  tone-1: "#C45A0A"
  tone-2: "#0E6F87"
  tone-3: "#7A4B9C"
style:
  elevation: offset
```

**Each key has a reference deck of its own** and works without the others. The
boxes need no key at all: `::: activity` is a directive.

## example: Source, build and views | One file in, four files out {.wide #web}

**An author writes one Markdown file; the build turns it into four views.**

::: cards 3 {.small}
- **:fa-file-lines: Source** {.accent}\
  One Markdown file per lecture, the only thing an author writes.
- **:fa-gears: Build** {.tone-2}\
  Compiles figures and maths, inlines every asset, checks the frame.
- **:fa-display: Views** {.tone-4}\
  Projection, cockpit, handout and notes – each a self-contained file.
:::

1. Write `lectures/demo/source.md`.
2. Run `node build.js lectures/demo/source.md`.
3. Open `audience.html` on the projector and `speaker.html` beside it.

::: activity info
Every view opens from disk without a server; send the handout as one file.
:::

## example: What the reader is to do {.wide #boxes}

::: activity link
The tutorial lecture is in `lectures/tutorial/`, built views included.
:::

::: activity info
Every box has its colour and its mark, and the edge under it prints.
:::

::: activity task
Build the tutorial and press `?` in its audience view.
:::

::: activity example
`::: activity example` is the line that drew this box.
:::

## figure: Colour that means something {.wide #figure}

::: draw 120x50
box idp "Identity provider" {.tone-1}
box user "Browser" right of idp gap 1.2 {.tone-2}
box db "Database" below idp gap 1.2 {.tone-3}
box atk "Attacker" below user gap 1.2 {.tone-4}
edge user -> idp "login"
edge idp -> db "lookup"
edge atk -> user "phishing" {.accent}
:::

# Where they differ {#differ-part}

## free: Not every key reaches every view {.wide #views}

**Four views, and three settings behave differently in them:**

::: cards 3 {.small}
- **:fa-print: soft and lifted**\
  live views only; a blur on paper is a smear
- **:fa-location-crosshairs: logo-place**\
  live views only; paper takes `logo-print`
- **:fa-moon: accent-dark**\
  the dark theme only, which the document does not have
:::

Everything else – the accent, the ink on it, the frame, the tones, the hard
edges, the icons and the boxes – is in the projection, the cockpit, the
document and the notes.

## free: Themes change some of it, on purpose {.wide #themes}

**Press `A`.** Across the four light themes the accent, the tones and the box
colours hold. On `dark` the accent holds if it carries and the figures and card
rows return to the page's own inks. On the two terminal themes everything takes
the single phosphor colour those themes are, and the marks keep the boxes
apart.

## closing: Six keys | none of which needs the others {#end}

Take one, take all; a deck that writes none of them builds what it built before.

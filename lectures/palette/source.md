---
title: Four accents that mean something
subtitle: Tone colours of a deck's own
presenter: Christian Roth
contact: https://github.com/UBA-PSI/psi-slides
notice: Built from this one file.
info: |
  A reference lecture
  psi-slides
section: number
theme: light-red
lang: en
collapse: none
auto-fit: true
palette:
  tone-1: "#C45A0A"
  tone-2: "#0E6F87"
  tone-3: "#7A4B9C"
---

<!-- linter: ignore tone-contrast, diagram-bar-contrast -->
<!--
Both ignored on purpose. tone-2 is a mid-dark teal that draws a perfectly good
box and card and a column the room cannot see, and the slide #columns exists to show that
difference - on the light themes through tone-contrast, and on the two terminal
themes, where the figure falls back to the mixed tones, through the figure
language's own column warning. The findings are the subject of that slide.
-->

## title: {#cover}

# What a tone is {#tone-part}

## principle: One hue and three greys {#why}

**`tone-1` to `tone-4` are mixed from the page's own two inks**, the accent and
the near-black text. That is a good default: the tones cannot clash, and they
survive all seven themes. It is also one hue and three greys, which is not
enough for a figure where colour *means* something.

## definition: `palette: {tone-1: …}` {.wide #key}

```yaml
palette:
  tone-1: "#C45A0A"   # source
  tone-2: "#0E6F87"   # build
  tone-3: "#7A4B9C"   # views
  # tone-4 is left out, so it keeps the accent
```

**The key re-points the colour each tone is mixed from, and nothing else.** The
mixing strengths, the difference between a box and a column, and the contrast
warning all stay, and work on the new colours. A figure needs no new words:
`{.tone-1}` is what it already writes, and a card row writes the same.

## example: A card row takes the tones too {.wide #cards}

::: cards 3 {.small}
- **Source** {.tone-1}\
  One Markdown file per lecture, the only thing an author writes.
- **Build** {.tone-2}\
  Compiles figures and maths and inlines every asset.
- **Views** {.tone-3}\
  Four self-contained HTML files: projection, cockpit, handout, notes.
:::

**Each card names its colour after its heading,** `{.tone-2}` or `{.accent}`.
A whole row takes one with `::: cards 3 {.tone-2}`, or the tones in turn with
`{.tones}`. The ground stays what it was – a panel tinted, not a new kind of
card.

## figure: Four kinds of thing {.wide #boxes}

::: draw 120x50
box idp "Identity provider" {.tone-1}
box user "Browser" right of idp gap 1.2 {.tone-2}
box db "Database" below idp gap 1.2 {.tone-3}
box atk "Attacker" below user gap 1.2 {.tone-4}
edge user -> idp "login"
edge idp -> db "lookup"
edge atk -> user "phishing" {.accent}
:::

# Boxes and columns {#column-part}

## figure: A column is mixed twice as strong {.wide #columns}

::: draw 150x62
bars a "12,15,19,24" "Q1 Q2 Q3 Q4" at 0,0 w 1.9 h 1.05 key "tone-1" {.tone-1}
bars b "9,11,10,21" "Q1 Q2 Q3 Q4" right of a gap 3.5 w 1.9 h 1.05 key "tone-2" {.tone-2}
:::

**A box is filled pale so its label stays legible; a column has no label and is
filled at roughly twice the strength.** A tone-2 column is 45 % of its colour
over the paper – a strength tuned for near-black ink. This teal draws a good box
and a good card, and a column at 1.97 : 1, under the 3 : 1 a projector needs;
both the build and `lint.js` say so.

## principle: Dark themes keep their own tones {.standard #themes}

**Press `A` to a dark or a terminal theme and the figures and cards fall back
to the page's own inks.** Four colours tuned against white paper are not four colours on
phosphor green, and the mixing is exactly what lets a figure survive a theme
switch. The printed document has no themes and wears the palette.

## closing: That is the whole key | Four names, the same four words {#end}

The figure language already had the vocabulary. The deck now chooses the
colours.

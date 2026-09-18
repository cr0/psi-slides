---
title: A figure box is a card
subtitle: The same tint, heading and edge, drawn in SVG
presenter: Christian Roth
contact: https://github.com/UBA-PSI/psi-slides
notice: Built from this one file.
info: |
  A reference lecture
  psi-slides
section: number
theme: light-teal
lang: en
collapse: none
auto-fit: shrink
style:
  elevation: offset
palette:
  tone-1: "#2E6DB4"
  tone-2: "#1F9BB0"
  tone-2-text: "#187686"
  tone-3: "#3C9A6A"
  tone-3-text: "#307B55"
  tone-4: "#7A4B9C"
---

<!-- linter: ignore tone-contrast -->
<!-- The mid-lightness tones are chosen for boxes and cards; the one chart here uses tone-4. -->

## title: {#cover}

# Cards and boxes {#part}

## example: The row and the figure agree | Same tone, same look {.wide #agree}

**Under `elevation: offset` a box in a figure is drawn the way a card is.**

::: cards 3 {.small}
- **Source** {.tone-1}\
  one Markdown file
- **Build** {.tone-2}\
  figures, maths, assets
- **Views** {.tone-3}\
  four self-contained files
:::

::: draw 150x40
default box w 1.4 h 1.1
box src "Source\none Markdown file" at 0,0 {.tone-1}
box build "Build\nfigures, maths" right of src gap 0.9 {.tone-2}
box views "Views\nfour files" right of build gap 0.9 {.tone-3}
edge src -> build
edge build -> views
:::

## figure: Every answer a box can give | tones, accent, emph, shapes, dim {.full #answers}

::: draw 150x62
default box w 1.3 h 0.8
box plain "Plain\nno tone" at 0,0
box t1 "Tone 1\ninfrastructure" right of plain gap 0.6 {.tone-1}
box t2 "Tone 2\nusers" right of t1 gap 0.6 {.tone-2}
box t3 "Tone 3\ndata" right of t2 gap 0.6 {.tone-3}
box t4 "Tone 4\nfree" right of t3 gap 0.6 {.tone-4}

box atk "Attacker" below t1 gap 1.0 {.accent}
box hot "Look here\nemph on a tone" right of atk gap 0.6 {.tone-2 .emph}
box hex "Hex\nshape" right of hot gap 0.6 {.tone-3 .hex}
box frame "Clear frame" right of hex gap 0.6 {.clear}
container zone over atk,hot pad 0.3
edge atk -> t1 "request" {.accent}

step dim
dim plain, t1, t2, t3, t4
:::

## figure: Columns are not cards | a chart keeps its bars {.wide #bars}

::: draw 150x50
bars chart "3,5,2,4" "Mon Tue Wed Thu" at 0,0 w 2.4 h 1.0 {.tone-4}
:::

## closing: One construct, two renderings {#end}

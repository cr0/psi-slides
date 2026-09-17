---
title: The frame a deck wears
subtitle: A mark and a line, and the band the text yields
presenter: Christian Roth
contact: https://github.com/UBA-PSI/psi-slides
notice: Built from this one file.
info: |
  A reference lecture
  psi-slides
section: number
theme: light-blue
lang: en
collapse: none
auto-fit: true
slide-numbers: off
identity:
  logo: mark.svg
  logo-place: corner
  footer-left: "The frame a deck wears · a reference lecture"
  footer-right: "psi-slides"
---

## title: {#cover}

# A frame is a dock {#dock-part}

## principle: Two marks say which room a slide is in {#why}

**A mark in the top corner and a line along the foot.** Every slide in this
deck carries both, and neither is part of any slide: they belong to the frame
the slides are projected into.

## definition: Five keys under `identity:` {.wide #keys}

```yaml
identity:
  logo: mark.svg          # beside source.md, staged like any image
  logo-place: corner      # footer (default) | corner | none
  logo-print: cover       # cover (default) | every | none
  footer-left: "Course · Lecturer"
  footer-right: "Term"
```

**All five are optional, and a deck that writes none of them emits nothing.**
The logo goes through the same pipeline as every other image, so it is inlined
under the same budget and left external under `--no-inline-images`.

## free: The text yields, the way it yields to a dock {.wide #reserve}

**`::: dock` takes its column by growing the chunk's own padding.** The frame
takes its band the same way, which is why the words above this line stop short
of the footer without anyone measuring them.

Everything that already reads that padding follows for free: `auto-fit` sizes
the slide to the smaller box, the speaker's mirror matches it pixel for pixel,
and `--check-fit` measures a content box that already ends above the band.

## free: A long slide scrolls under the band {.wide #scroll}

**A chunk taller than the frame is walked down as its beats advance**, and on
the way its prose would pass straight through the footer. No reserve can stop
that – the chunk never fitted – so the band fades to paper under the line and
the text goes somewhere instead of colliding with the lecturer's name.

# Where the frame yields {#yield-part}

## principle: Anything that covers the stage takes the frame with it {.wide #hidden}

**Press `O`, `T`, `/`, `?` or `B`.** The overview board, the table of contents,
search, the help sheet and the blank screen each hide the frame, and so do a
focused figure, a live demo, the link overlay and the export modal.

A logo glowing on a deliberately black screen is the one place a frame must not
be. The list of these states is held against the stylesheet by a gate, so an
overlay added later cannot forget it.

## free: The corner has a price {.wide #corner}

**This deck wears its mark in the top-right corner**, where a slide master
puts one – up against the frame's edges and large enough to read as a
signature from the back of the room.

That corner is not free. A `::: marginalia` aside sits there and the slide
numbers push it down, so this deck turns the numbers off, and `lint.js` warns
`logo-corner-marginalia` for a deck that has not. `logo-place: footer` is
still the default, because it costs neither: the mark then sits at the end of
the footer line.

# On paper {#paper-part}

## free: A document already has a cover {.wide #print}

**The printed views wear the frame differently**, because a handout has a cover
and page numbers and needs the two marks once rather than on every slide.

::: cards 2 {.small}
- **`logo-print: cover`** – the default\
  the mark and the line head the first page, in the flow
- **`logo-print: every`**\
  a running foot, repeated on each printed page
:::

On screen, `every` renders as the head too: a fixed element in a document
somebody scrolls is a bar over the last two lines, not a running foot.

## closing: That is the whole frame | A mark, a line, a band {#end}

Reserved like a dock, hidden with the stage, and set again for paper.

---
title: How far a card stands off the page
subtitle: One key over a ladder that was already built
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
auto-fit: true
style:
  elevation: offset
---

## title: {#cover}

# The key {#key-part}

## principle: The ladder existed, the choice did not {#why}

**Three shadow steps have been in the stylesheet all along** – rest, float and
quiet, in em so a shadow keeps its proportion to the card. What was missing was
a say over which cards use them, and a fourth answer that is not a blur at all:
the hard edge a slide master draws under a callout.

## definition: `style: {elevation: …}` {.wide #values}

```yaml
style:
  elevation: offset    # flat (default) | soft | lifted | offset
```

::: cards 2 {.small}
- **flat**\
  today's rendering; a deck that says nothing emits no rule
- **soft**\
  the resting step on every card and overlay ground
- **lifted**\
  the floating step, one higher
- **offset**\
  a hard edge at 45 degrees in the box's own darker shade – this deck
:::

## example: Every ground with a box {.wide #grounds}

::: cards 2 {.panel}
- **panel**\
  tinted, and now lifted as well
- **a second one**\
  so the row reads as a row
:::

::: cards 2 {.paper}
- **paper**\
  the ground that always had depth
- **a second one**\
  and keeps it, one step higher
:::

## free: A card with no box has no shadow {.wide #clear}

::: cards 2 {.clear}
- **clear**\
  no fill and no border
- **so nothing to lift**\
  a shadow here would outline empty space
:::

**Two grounds are left out once, in the list of grounds, rather than by a guard
on every rule:** a clear card and a clear overlay have no box, and a shadow on
either draws a rectangle around nothing.

# Where it stops {#limits-part}

## principle: Only the hard edge reaches paper {.standard #print}

**A blur on paper is a grey smear; a solid edge is an edge.** So the two soft
steps stay on screen and the document separates a card with a rule, while
`offset` is drawn in the handout too – even when the reader prints without
background graphics, which would otherwise drop it.

## free: A shadow is the one thing no probe can see {.wide #bound}

**`--check-fit` measures a card's box, and a box does not include its shadow.**
So the bound is held as a relation instead: the furthest-reaching step, at the
largest `body-scale` the format allows, has to stay inside the slide's own
padding. A gate reads all four numbers out of the stylesheet.

The headroom is 0.7 %, and the gate found something older on the way: the
*resting* step reaches further below a card than the floating one, and just
past the padding at `body-scale: 1.8`. That one is recorded, not changed – the
fix would move how every existing deck looks.

## closing: That is the whole key | Four words, one of them for paper {#end}

Soft and lifted on screen, offset everywhere, and flat until a deck asks.

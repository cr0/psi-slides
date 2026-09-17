---
title: Boxes that say what to do
subtitle: Link, info, task, example and takeaway
presenter: Christian Roth
contact: https://github.com/UBA-PSI/psi-slides
notice: Built from this one file.
info: |
  A reference lecture
  psi-slides
section: number
theme: light-orange
lang: en
collapse: none
auto-fit: true
---

## title: {#cover}

# Five kinds {#kinds-part}

## principle: A box is read before it is read {#why}

**A lecture asks five things of its room** – follow this, note this, do this,
look at this, remember this. A box of each kind is recognised by its colour and
its mark before a word of it is read, which is why there are five and not one.

## example: All five {.wide #all}

::: activity link
The tutorial lecture is in `lectures/tutorial/`, built views included.
:::

::: activity info
Press `?` in either live view for every key, grouped by task.
:::

::: activity task
Build `lectures/tutorial/source.md` and open its `audience.html`.
:::

::: activity example
`::: activity example` is the line that drew this box.
:::

::: activity takeaway
One box on a slide wears the deck's accent, and it holds the sentence to remember.
:::

## definition: One word on the directive {.wide #syntax}

```md
::: activity task
Build the tutorial and open its audience view.
:::
```

**The kind is the whole vocabulary:** `link`, `info`, `task`, `example` and `takeaway`. The
colour and the mark come with it, so a box looks the same on every slide and
in every lecture without an author assembling it.

::: activity info
**A box is a statement on the slide,** not a card in a row and not a note in
the margin – so it is refused inside `::: cols`, `::: marginalia` and another
box, and a card row cannot open inside one.
:::

# What it looks like everywhere {#look-part}

## free: Its own marks, its own edge {.wide #marks}

**The five marks are drawn by the build**, not taken from an icon set, so a box
does not depend on a deck installing one. They are inline and take the kind's
colour.

**The hard edge under each box is part of the box.** It is a darker shade of
the box's colour at 45 degrees, and it prints – a solid edge prints as an edge,
and it is kept when a reader prints without background graphics.

## principle: Themes keep the kinds apart {.standard #themes}

**Press `A`.** On the light themes and on `dark` each kind keeps its colour; the
takeaway box takes the deck's accent. On the two terminal themes all five take
the single phosphor tone those themes are, and the mark tells them apart.

## closing: Five words | one box each {#end}

Link, info, task, example, takeaway – recognised before they are read.

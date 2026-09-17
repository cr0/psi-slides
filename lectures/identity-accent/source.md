---
title: A deck's own accent
subtitle: One hex, and the arithmetic it needs
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
identity:
  accent: "#EC8A3C"
  ink: "#565B63"
---

<!-- linter: ignore accent-contrast -->
<!--
The warning is ignored on purpose: this deck exists to show what the build
does with an accent that fails white ink, so it has to wear one. The finding
itself is the subject of the slide #ink.
-->

## title: {#cover}

# What the key does {#key-part}

## principle: A house colour is a hex value {#why}

**The seven themes are seven tuned colours, and none of them is anyone's.** An
institution's accent comes out of a corporate manual as a hex value, and until
now the only way to wear one was a stylesheet written against the engine's
internals.

## definition: `identity: {accent: …}` {.wide #accent}

**One key, and the build does the arithmetic the colour needs:**

```yaml
identity:
  accent: "#EC8A3C"    # quoted: an unquoted # starts a YAML comment
  ink: "#565B63"       # the house's text grey, and every colourless box
```

This deck wears it. The rule under the heading, the numeral on the dividers and
a bold phrase set in the accent all take it. **A deck that writes no
`identity:` block emits nothing** and builds byte for byte what it built before
the key existed. `ink` does the same for the text: this deck is set in the
house grey rather than the theme's near-black, and so is every colourless box.

## free: What a stylesheet cannot derive {.wide #hue}

**The greys have a hue too.** `--ink`, `--paper`, `--rule` and every shadow are
mixed on `--accent-h`, which each theme sets to its own number.

`--accent-h` is a bare number inside `oklch()`, not a colour, so nothing written
in CSS can compute it from a hex. The build can: `#EC8A3C` is
`oklch(0.725 0.149 55.6)`, and the deck's greys and shadows lean toward 55.6
rather than toward the theme's 60. Under `style: {neutrals: warm}` or `cool` it
is held back, because there the author has already asked for a fixed hue.

# The ink on the accent {#ink-part}

## example: A card on the accent {.wide #ink}

::: cards 1 {.accent}
**Read this line.** A card on the accent reverses the ink onto it, and this
one carries dark ink because the build measured that white would not carry.
:::

## free: Measured, not assumed {.wide #measured}

**The tuned accents are dark, so white ink is right for them.** A colour from a
print manual usually is not. Measured against this deck's accent:

::: cards 3 {.small}
- **2.54 : 1**\
  white on `#EC8A3C`
- **7.13 : 1**\
  the deck's ink on it
- **4.5 : 1**\
  what a sentence needs
:::

So the build puts dark ink on the accent grounds and says so once on its log.
`lint.js` warns `accent-contrast` for the case it cannot fix: a bold phrase set
in the accent has no ground to reverse against.

# Seven themes {#themes-part}

## principle: `A` does not move it {.standard #keys}

**Press `A`. Across the four light themes the accent stays where it is,** and
nothing has been disabled to make that true: the identity's rule is written
after the theme's and wins on order.

The two terminal themes are not reached at all. A single phosphor tone is what
those are, and a colour tuned for white paper is not one.

## free: A dark ground usually needs nothing {.wide #dark}

**A colour too light for white paper is what a dark ground wants.** On `dark`,
`#EC8A3C` measures 7.53 : 1 and is used as it is.

An accent that would not carry there is lifted – same hue, same chroma, more
light – until it does. A design department that has already chosen a dark-mode
colour writes it down:

```yaml
identity:
  accent: "#EC8A3C"
  accent-dark: "#FFA24D"
```

## closing: That is the whole key | One hex, three grounds {#end}

The light themes, `dark`, and the printed document, each measured against its
own paper.

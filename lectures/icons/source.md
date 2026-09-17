---
title: A mark beside a word
subtitle: Icons that are still words
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
icons: fontawesome-free
---

## title: {#cover}

# The key {#key-part}

## principle: Some things are faster to see than to read {#why}

**A lock :fa-lock:, a key :fa-key: and an attacker :fa-user-secret: are read
before the sentence around them.** A slide about a stolen session cookie :fa-key:
that is a valid login :fa-user-check: says so twice, once in words and once at a
glance.

## definition: `icons: fontawesome-free` {.wide #key}

```yaml
icons: fontawesome-free    # or none, the default
```

**One key, and three prefixes in prose,** which are Font Awesome's own:

::: cards 3 {.small}
- **`:fa-lock:`**\
  solid :fa-lock:
- **`:far-envelope:`**\
  regular :far-envelope:
- **`:fab-linux:`**\
  brands :fab-linux:
:::

Written inside backticks, as the three names above are, the token stays text –
a code span is read before an icon is.

## example: A mark in a card's heading takes its colour {.wide #heading}

::: cards 3 {.small}
- **Source** :fa-file-lines:\
  one Markdown file per lecture
- :fa-gears: **Build**\
  figures, maths and assets
- **:fa-display: Views**\
  projection, cockpit, handout
:::

**An icon beside a card's bold heading belongs to the heading,** on either side
of it or inside it, and is set in the heading's colour rather than the body's
ink.

# Still a word {#word-part}

## free: An inlined picture, not a font {.wide #svg}

**Every icon is an inline SVG with the icon's name as its title.** Search this
deck for `bug` and the slide with :fa-bug: is found; the text view that
`--squint` writes reads it as the word. An icon font would have put a
private-use character in both places.

It is one line tall, takes the colour of the sentence it sits in, and follows
`A` through all seven themes with no rule of its own: the files already draw in
the current colour.

## free: A typo stops the build, not the room {.wide #typo}

**A name the set does not have fails the build with the three nearest names**,
and it fails after rendering and before writing, so the last good build stays
on disk whole. A token in a deck that has no `icons:` key is left as the text it
is, and `lint.js` warns `icon-without-set` so it is caught before the lecture.

# What it costs {#cost-part}

## free: A development dependency, and an attribution {.wide #cost}

::: cards 2 {.small}
- **41 MB, once**\
  the set is a devDependency; a deck without an icon carries nothing
- **CC BY 4.0**\
  the attribution is written into every view that holds an icon
:::

**Icons do not go inside a `::: draw` block.** The figure editor rewrites those
by character position, and a figure that wants a mark already has the `image`
statement, which takes an SVG.

## closing: That is the whole key | Three prefixes, one line tall {#end}

Search it :fa-magnifying-glass:, read it aloud, print it – it is still a word.

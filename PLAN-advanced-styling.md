# Advanced styling: an identity, an accent palette, elevation and icons

A lecture can already choose a theme, a font roster, a display face and
fourteen `style:` keys. What it cannot do is look like it comes from a
particular institution. Four things are missing, and they were found the way
this project prefers to find things – by building slides in an institution's
house style and listing what had to be faked:

1. **An exact accent.** A house colour is a hex value in a corporate manual.
   The seven themes are seven tuned `oklch()` triples, and none of them is
   anyone's.
2. **A frame.** A bildmarke in one corner and a footer line along the bottom –
   the two marks that say which room a slide is in.
3. **An accent palette.** One accent and greys mixed out of it. A deck that
   uses colour to *mean* something, held constant over a series of lectures,
   has one hue and three greys to say it with.
4. **Elevation and icons.** A card that lifts off the page, and a mark beside
   a word that is not a word.

This plan builds all four as **declared frontmatter the build renders**. It
does not add an author stylesheet; that is named under *Deferred* with the
reason.

## What a hand-written stylesheet costs, stated before the design

Without these keys, a house style is a hand-written `<style>` block in the body
of the title chunk – it has to be in a chunk body, because a `<style>` before
the first chunk is discarded by the build – and such a block does three things
the engine has no key for:

```css
html body[data-theme=light-orange] { --emph: #EC8A3C; }
@media screen {
  #stage-viewport::before { /* the bildmarke, top right */ }
  #stage-viewport::after,
  body::after { /* the two halves of the footer */ }
  body:is([data-overview], .overview, [data-panel]) … { display: none; }
}
```

Five things are wrong with that, and each one is a property the design below has
to fix rather than inherit:

- **It names internals.** `#stage-viewport` is an id in `AUDIENCE_CSS`, and
  the interface promise is the source format, not the DOM.
- **The last selector is a guess.** `body:is([data-overview], .overview,
  [data-panel])` is three spellings of "some panel is up", written by someone
  who could not know which one is real, so that at least one of them matches.
  None of them covers `B`, the blank key (`body.blanked`, build.js:12405) –
  a bildmarke glowing on a deliberately black screen is the one place the
  frame must not be.
- **It is `@media screen` only**, so the document gets no identity at all.
- **It re-points `--emph` and nothing else.** `--accent-h` stays at the
  theme's own hue (build.js:8890), so `neutrals: tinted` and the shadow ladder
  carry hue 60 under a house colour that measures `oklch(0.725 0.149 55.6)`.
- **The mark takes a corner that is already occupied.** A logo in the top
  right of the viewport sits over the content box, where `--slide-pad-y` is
  44 px of a 900 px frame (build.js:8766), and it is exactly where a
  `::: marginalia` aside sits
  (`top: var(--slide-pad-y); right: calc(var(--slide-pad-x) * 0.35)`,
  build.js:9166) and where the slide numbers push it down to
  (build.js:9443). A deck that puts its logo there has to turn its slide
  numbers off to make room. A frame that
  costs a deck `::: margin` and its slide numbers is not a frame, it is a
  collision.

## The mechanism this plan is built on

The engine already has the construct this feature needs, and it is not a new
one: **`::: dock` is a frame element the text yields to**, and it yields by
growing the chunk's own padding.

```css
.chunk { padding: var(--slide-pad-y) var(--slide-pad-x); }
.chunk[data-dock=left]  { padding-left:  calc(var(--dock-px) + var(--dock-gap)); }
.chunk[data-dock=right] { padding-right: calc(var(--dock-px) + var(--dock-gap)); }
```

`--exp-band` is the same idea in the other direction: the expand chevrons
float over the foot of the slide, so the words stop short, and the reserve is
written as padding under `.chunk-content` – "which is also where
`flowHeightProbe()` wants it, since that function reads a level's own paddings"
(build.js:9127).

**So the identity frame is a dock.** It reserves its band by adding to the
chunk's padding, which means – without one line of new machinery – that
`auto-fit` counts it, the speaker mirror matches pixel for pixel (both views
derive slide-internal sizes from `--slide-h`), the camera and the zoom leave it
alone, and `--check-fit` measures a content box that already stops short of the
footer. The first draft of this plan proposed a new `--frame-inset-*` contract
and a change to the probe. That was a second mechanism for a job the first one
already does.

## The four parts

### 1 – `identity:`, the frame

```yaml
identity:
  accent: "#EC8A3C"
  logo: logo.svg                  # beside source.md, staged like any asset
  logo-place: footer              # footer | corner | none   (dflt: footer)
  logo-print: cover               # cover | every | none     (dflt: cover)
  footer-left: "Course · Lecturer"
  footer-right: "Term"
```

Six keys, all optional, and **a deck that declares none of them builds
byte-identical HTML** – the property `fonts: {display}` earns by resolving to
nothing. The block is emitted beside `fontStyleTag` rather than into
`AUDIENCE_CSS` / `PRINT_CSS`, for the reason recorded in
PLAN-display-face.md: a rule naming a variable nothing sets still moves every
existing output's bytes.

**`logo-place: footer` is the default because the top-right corner is taken.**
The footer is one band along the foot of the slide, and the logo sits in it, at
the end opposite `footer-left`. One reserve instead of two, `.marginalia` and
the slide numbers keep their corner, and a deck stops having to turn a feature
off to make room for a picture. `corner` is there for a deck that wants the
mark up top and is willing to pay for it – and it **is** a payment, made
explicit: under `corner` the build adds the mark's height to the top reserve,
and `lint.js` warns (`logo-corner-marginalia`) when the same deck also uses
`::: marginalia` or leaves slide numbers on.

**`accent` is a colour, and the build does the arithmetic.** Given a hex it
computes the oklch triple and emits three things:

```css
html body[data-theme^=light] {
  --emph: #EC8A3C;
  --accent-h: 55.6;     /* derived – a bare number, underivable from CSS */
  --emph-ink: #000;     /* derived – see the contrast finding below */
}
```

Three details carry the design:

- **`--accent-h` can only be computed at build time.** It is a bare number in
  an `oklch()` argument list, not a colour, so there is nothing for CSS to
  derive it from. This is the half the workaround cannot do at all, and it is
  why `neutrals: tinted` and every shadow under a house colour are currently
  tinted toward the theme's hue rather than the deck's.
- **The specificity is the whole immunity story.** A theme rule is
  `body[data-theme=light-orange]`, one type plus one attribute; the identity
  rule is `html body[data-theme^=light]`, one more type and the same attribute,
  so it wins in every light theme without a single `!important` and without
  anything that tries to disable a reader key. `A` still cycles all seven
  themes – the accent simply does not move across the four light ones.
- **The two terminal themes keep their own accent, and `dark` gets a derived
  one.** A single phosphor tone is what a terminal theme *is*, so those are
  out by construction. `dark` is different, and the engine has already
  answered it once by hand: its accent is "the light-red accent lifted until
  it carries on a dark ground" (build.js:8836), `oklch(0.42 0.16 30)` become
  `oklch(0.76 0.15 35)`. That is a derivation, written down as prose. Made
  arithmetic it is: **keep the hue and the chroma, solve the lightness for the
  contrast floor against the dark paper.** Measured, a house colour usually
  needs nothing – `#EC8A3C` unchanged carries 7.53 : 1 on the dark paper,
  because a colour too light for white paper is exactly the colour a dark
  ground wants. The derivation only fires for an accent that would fail there,
  and `accent-dark:` overrides it, because a second hex is a decision a design
  department may already have made.

**The frame yields the way an overlay expects.** The states in which it must
not paint are a constant, `FRAME_HIDDEN_STATES`, interpolated into the
selector the way `THEME_NAMES` is interpolated into three places – and a fast
gate asserts that every body class in `build.js` that dims, blurs, blanks or
replaces the stage is in the list. That is the answer to the workaround's
three-spellings guess: not a better guess, but one list with a check on it.
`blanked` is in it, and the gate is what keeps it there.

### 2 – `palette:`, four accents that mean something

```yaml
palette:
  tone-1: "#2E6DB4"     # infrastructure
  tone-2: "#3F8F4F"     # users
  tone-3: "#7A7A7A"     # data
```

Today `tone-1`…`tone-4` are **mixes of `--emph` and `--ink` against
`--paper`** (`DG_BAR_FILLS`, diagram-core.mjs:201) – one hue and three greys.
That is a good default: it cannot clash and it survives all seven themes. It
is also why a figure of three different kinds of thing draws them as two greys
and a pale accent.

`palette:` re-points the tone tokens and nothing else. The mixing table, the
bar strengths, the box/column distinction and `DG_BAR_CONTRAST_MIN` stay
exactly as they are and operate on the new base colours, so a palette colour
too pale for a column still gets the warning it would have got.

**It is scoped by `^=light` for the same reason the accent is**, and here the
reason is sharper: four hues tuned against white paper are not four hues on
`terminal-green`. On the dark and terminal themes the tones fall back to
today's derived mixes – one rule, no new vocabulary, and the property that
makes a theme switch survivable is exactly the derivation that is kept.

The figure language needs nothing new: `{.tone-1}` already exists, is already
documented, and is already what a deck writes.

### 3 – `style: {elevation: …}`, the shadow on purpose

The ladder is built and correct – `--shadow-rest`, `--shadow-float`,
`--shadow-quiet`, in em, hue-following, one elevation model
(build.js:8750–8754). What is missing is an author's say over which grounds
use it. Today exactly one does: `.cards.cg-paper`, and the comment says why –
it "carries a shadow rather than a border… because there is no tint to
separate it" (build.js:11402). A `cg-panel` card is tinted, so it gets none.

```yaml
style:
  elevation: flat | soft | lifted     # dflt: flat
```

`flat` is today's rendering, so the default costs nothing and no tracked
output moves. `soft` puts `--shadow-rest` on every card ground and on a
`::: side` panel; `lifted` promotes those to `--shadow-float`. A `STYLE_SPEC`
enum mirrored in `lint.js`, in the shape of the ten enums already there.

**The bleed is bounded rather than measured.** `getBoundingClientRect()` does
not include `box-shadow`, so no probe in this repository can see a shadow
leave the frame. The answer is not a cleverer probe: it is that the largest
blur in the ladder is 0.95em and the chunk's vertical padding is
`var(--slide-h) * 0.049` – 44 px in a 900 px frame – so the relation
"largest shadow blur at the largest `body-scale` stays inside `--slide-pad-y`"
is asserted by a fast gate against the two constants, and written beside
`--shadow-float`. A ladder that grows past that bound fails the gate rather
than the room.

**Why a key and not a class.** "Three sizes in one row read as a mistake
rather than as a hierarchy" is already the rule for card size
(build.js:11340). Elevation is the same kind of decision and belongs at the
same altitude – the deck, not the card.

### 4 – `icons:`, a mark beside a word

```yaml
icons: fontawesome-free     # or: none (dflt)
```

```markdown
A stolen session cookie :fa-key: is a valid login :fa-user-check:.
```

**Not a webfont.** Two of this repository's own tools decide it:

| | icon webfont | build-time SVG |
| --- | --- | --- |
| payload, 4 views × 14 lectures | the whole set, every view | only the icons named |
| `--squint` reads | a private-use codepoint | the `<title>`, which is a word |
| the search index (build.js:14464) reads | a private-use codepoint | the `<title>`, which is a word |
| colour | the text colour, free | `currentColor`, free |

`--squint` is the tool this project's conventions say to read before
arguing about a slide's wording, and `buildSearchIndex` reads `.chunk-body`
text. `textContent` descends into SVG, so an inlined
`<svg aria-hidden="true"><title>key</title>…</svg>` is the word *key* in both,
and an icon font is a private-use codepoint in both. That is the whole
argument, and it is why `<title>` is mandatory rather than nice.

So: `@fortawesome/fontawesome-free` is a **devDependency**, the build reads
`svgs/<style>/<name>.svg` for the icons a deck names, and inlines them sized in
em and filled with `currentColor`. An unknown name fails the build with the
nearest three, the way an unknown font family does. **Icons are out of scope
inside a `::: draw` block**: `editor.mjs` rewrites those by character span, and
a figure that wants a mark uses the `image` statement, which already takes an
SVG. Naming that keeps the span table out of the blast radius.

**CC BY 4.0 wants attribution**, and a deck should discharge it rather than
leave every lecturer quietly non-compliant: one line in the printed document's
colophon when, and only when, at least one icon was inlined.

## What breaks, and the answer

The part worth reading before any code. Each finding is measured or read out
of the source; each answer is a mechanism that already exists here, except
where it says otherwise.

| # | What breaks | The answer |
| --- | --- | --- |
| 1 | The frame shrinks the usable slide and nothing knows | The frame is a dock: it reserves by chunk padding, so `auto-fit`, `flowHeightProbe`, the speaker mirror and `--check-fit` all follow for free |
| 2 | `--check-fit` calls a clipped slide "tall" | One line: classify against the usable height, not `vpH` |
| 3 | White on the house accent is 2.54 : 1 | Measure the luminance at build time, emit `--emph-ink`, warn in `lint.js` |
| 4 | `--accent-h` stays at the theme's hue | Derive it from the hex at build time; CSS cannot |
| 5 | `A` can put a house colour on phosphor green | `^=light` scoping – structural, no key is disabled; `dark` gets a derived lift |
| 6 | Four fixed hues are not four hues on a dark theme | Same scoping; the derived mixes stay as the fallback |
| 7 | The logo's corner is a `::: marginalia` aside's corner | `logo-place: footer` by default; `corner` costs a reserve and a lint warning |
| 8 | A shadow leaves the frame unseen by any probe | Bound the ladder against `--slide-pad-y` in a gate |
| 9 | "Which overlay is up" is a guess | `FRAME_HIDDEN_STATES`, one list, gated |
| 10 | An icon is invisible to `--squint` and to search | Inline SVG with a mandatory `<title>` |
| 11 | A logo bypassing the asset pipeline breaks under `--no-inline-images` | Stage it like any other image |

Four of them are worth more than a table row.

### 3 – the house colour is chosen for print on white, and `.cg-accent` reverses ink onto it

Measured: `#EC8A3C` against white is **2.54 : 1**; against black, 8.27 : 1.
WCAG AA is 4.5 for body text and 3.0 for large text, so white-on-house-orange
fails **both** – and a callout card on that accent carries the failure on
every slide that uses one.
The token it replaces, `oklch(0.54 0.17 60)` (build.js:8834), is 0.19 darker,
which is exactly where the margin went.

This is not a reason to refuse a light accent; a corporate manual is not
negotiable and the colour is right. It is a reason for the build to stop
assuming. `--emph-ink` is computed from the accent's own luminance, every
reversed-ink rule reads `var(--emph-ink, var(--paper))` instead of hard-coding
the paper, and the build log says once which way it went and why. `lint.js`
carries the same forty lines as `accent-contrast`, because this is the finding
an author needs before the room rather than after it.

The arithmetic is not new here: `diagram-core.mjs` already carries the
oklch→sRGB→luminance chain (diagram-core.mjs:235) for the bar-contrast check,
and this is the same function asked a second question.

**And it is checkable against this repository's own measurements.** The
comment beside `light-orange` records four ratios taken by hand – light-red
8.66, light-blue 5.99, light-teal 4.67, light-orange 4.96 (build.js:8827–8834).
Reading the tokens back through the chain gives 8.65, 6.02, 4.68 and 4.99. So
the function this feature needs is one the repository can already be tested
against, and the plan's own numbers are not a new source of truth: a gate
asserts the four, and if it ever disagrees with that comment, one of the two
is wrong and the build says which.

### 5 and 6 – immunity by specificity, not by prohibition

PLAN-display-face.md settled the same question for the display face and wrote
down the rule that made it free: the face is out of `F`'s cycle **because it
reads a variable no theme assigns**, not because anything says so. The same
shape works here. `html body[data-theme^=light]` outranks
`body[data-theme=light-orange]` by one type selector, so:

- the accent does not move when `A` is pressed among the four light themes;
- it is not applied on the two terminal themes, which keep the single phosphor
  tone they are, and on `dark` it is applied through the lift described above;
- nothing anywhere disables a reader key, which matters because a lecturer's
  projector is where a theme switch earns its keep.

**The rule to keep, one line in the comment beside it:** an identity token must
never be assigned at bare `:root` or `body`, and `FRAME_HIDDEN_STATES` must
never be spelled out in a selector. Both break silently.

### 9 – one list instead of three spellings

The workaround guesses `body:is([data-overview], .overview, [data-panel])`.
The real states are ordinary body classes – `overview-mode`, `toc-visible`,
`search-active`, `figure-focused`, `blanked`, `demo-live`, and the export
modal's own – and the gate is not that the list is right today but that it
cannot silently go stale: a fast gate greps `build.js` for every body class
used in a selector that dims, blurs, blanks or hides `#stage` and asserts it
is in `FRAME_HIDDEN_STATES`. A new overlay then fails a check in a fifth of a
second instead of shipping a logo over a search panel.

### 2 – the one line `--check-fit` does need

Everything else about the probe stays. `runCheckFit` splits its findings into
"fits the frame and is outside it" (the failure) and "taller than the frame,
read by scrolling" (a note), on `b.h <= b.vpH` (build.js:20929). With a
frame reserving a band, the usable height is no longer `vpH`, and a chunk
between the two is misfiled as scrollable when it is clipped. The comparison
reads the reserve; the probe already runs in the page and can read the
computed value off the chunk.

## Slices

**1 – `identity.accent`.** The hex, the derived `--accent-h`, the measured
`--emph-ink` with every reversed-ink rule reading it, `accent-contrast` in
`lint.js`, the `^=light` scoping with its comment. No frame yet. This slice
alone replaces the first line of the workaround and is independently useful.

**2 – the frame.** Footer and logo as a dock-style reserve, `logo-place`,
`FRAME_HIDDEN_STATES` and its gate, the `--check-fit` classification line, the
asset staging.

**3 – print.** `logo-print`, the running footer, the colophon hook slice 6
uses. The riskiest slice: a running head in print is `position: fixed`
repeated per page, because `@page` margin boxes cannot carry a generated
image. `cover` is the default so the risky half is opt-in.

**4 – `style: {elevation}`.** The enum, the grounds it reaches, the bound
against `--slide-pad-y` as a gate.

**5 – `palette:`.** The tone tokens, the `^=light` scoping with the derived
fallback, `DG_BAR_CONTRAST_MIN` fed the new base colours.

**6 – `icons:`.** The devDependency, the `:fa-name:` syntax, the inliner,
the mandatory `<title>`, the unknown-name refusal with suggestions, the CC BY
line in the colophon.

**7 – `lectures/advanced-styling/`.** The constructs shown rather than
described, in the shape `lectures/display-face/` takes, plus a page on the
project site.

Slices 1–3 are one feature and land together or not at all: an accent without
a frame is half the brief, and a frame that does not reserve its band is the
workaround with better manners.

## Deferred, and named so it is not forgotten

- **`style-sheet:`, an author CSS file.** The general escape hatch – a file
  beside `source.md`, inlined into all four views, against a documented set of
  stable hooks. It was the obvious first design and is deferred on purpose: it
  turns `#stage-viewport` and the card ground classes into interface, which is
  the promise this project deliberately does not make. Worth revisiting after
  the four parts above, when the list of things people reach for is evidence
  rather than speculation.
- **A corporate template.** README.md:213 and docs/comparison.md:147 record
  that psi-slides has no slide master and no export path. This plan does not
  change that and should not be described as doing so: it gives a deck an
  identity, not a template gallery.
- **`identity:` shared across a series.** Every lecture of a series repeats the
  same keys. An `extends:` or a series-level file is the obvious next want, and it
  is a *frontmatter* feature rather than a styling one – it should be designed
  against every repeated key, not just these.
- **Icon sets beyond Font Awesome Free.** One roster, one licence, one
  attribution line. A second set is a table, not a design.

## The dependency cost, stated plainly

`@fortawesome/fontawesome-free` is roughly 20 MB unpacked and would be a
**devDependency**: the build reads individual SVG files out of it, nothing
reaches an output that does not name an icon, and a user who never writes
`:fa-…:` pays only the install. Compare the display-face roster, which took
11.9 MB as a *runtime* dependency and was judged worth it. If 20 MB is judged
too much, the fallback already exists: an icon is an SVG in `assets/`, and a
deck carries the handful it uses.

Everything else here is zero-dependency.

## Verification

- **Byte-identical.** Build `lectures/tutorial` before and after, `diff` all
  four views. A deck declaring no `identity:`, no `palette:`, no `elevation`
  and no `icons:` must not move one byte. Built from two worktrees, not by
  copying `build.js` – it resolves its runtime files relative to itself.
- `node lint.js lectures/` clean; a bad hex, an unknown icon, a missing logo
  file and a `palette:` key that is not a tone all refused by **both**
  `build.js` and `lint.js`, asserted by a fixture in `test/gates/refusals.mjs`.
- `npm run gate` green, including the two new gates: `FRAME_HIDDEN_STATES`
  covers every stage-dimming body class, and the shadow ladder stays inside
  `--slide-pad-y`.
- **`--check-fit` at 1600×900 on a deck with a frame**, against a chunk built
  to end exactly on the footer band. It must fail, and it must name the slide
  as clipped rather than as tall. The single most important check here: it is
  what proves the reserve is real and not decorative.
- `--squint` on a deck with icons: every icon appears as its name. Search for
  an icon's name in the live view: the slide is found.
- `A` through all seven themes with an identity and a palette: the accent does
  not move across the four light ones, the greys follow, and both the accent
  and the palette fall back to the theme's own on `dark` and both terminals.
- `B`: the screen is black, nothing glows. Overview, TOC, search, help, export
  modal, figure zoom and a live demo: no frame.
- `::: marginalia` and `slide-numbers: horizontal` on a deck with a footer logo:
  untouched. The same deck at `logo-place: corner`: a lint warning.
- `--no-inline-images` on a deck with a logo: the frame still has one.
- Print and print-notes at `logo-print: every`: the running head repeats, the
  cover is unchanged, slide numbers still land, and the CC BY line is in the
  colophon iff an icon was inlined.
- Contrast: a deck at `#EC8A3C` gets black ink on `.cg-accent` and one line in
  the build log; a deck at `oklch(0.54 0.17 60)` keeps white and gets none.

---

# Build log

Written while building, in the shape `editor.md` §15 uses. **Read this section
first if you are picking the work up.**

## Where it stands

Four branches off `main`, each its own change, in the order they were built.
Every one of them leaves all four tutorial views **byte-identical**, checked
by rebuilding against the tracked HTML.

| branch | what |
| --- | --- |
| `styling/accent` | the hex, the derived `--accent-h`, the measured `--emph-ink`, the `^=light` scoping, `colour.mjs`, `accent-contrast`, `test/gates/identity.mjs` |
| `styling/frame` | the logo and footer band as a dock-style reserve, `FRAME_HIDDEN_STATES` and its gate, the `--check-fit` line, print |
| `styling/elevation` | `style: {elevation}`, `ELEVATION_GROUNDS`, the ladder's bound as `test/gates/elevation.mjs` |
| `styling/palette` | the tone bases, `DG_BOX_FILLS`, the oklab mix, `tone-contrast`, `test/gates/palette.mjs` |

`styling/frame` is branched off `styling/accent`, and `styling/palette` off it
too: both need the `identity:` block and the colour arithmetic to exist.
`styling/elevation` and `styling/icons` are off `main` and independent of all
of them.

Slice 7 became six decks rather than one. **Each branch carries a reference
deck that shows only its own key** – `lectures/identity-accent/`,
`identity-frame/`, `elevation/`, `palette/`, `icons/` – in the shape
`lectures/display-face/` takes, so every pull request demonstrates itself.
`styling/showcase` merges all five and adds `lectures/advanced-styling/`,
which wears every key at once. It contains merge commits by construction and
is meant as a preview; once the five are in `main` it rebases to one commit.

| branch | adds |
| --- | --- |
| `styling/icons` | `:fa-…:` as inline SVG with a `<title>`, `icon-without-set`, `test/gates/icons.mjs` |
| `styling/showcase` | all five merged, `lectures/advanced-styling/` |

## What the decks found

Writing a deck that wears a key turned out to be the best test of it: four
defects that every gate and every probe had passed.

- **`palette:` without `identity:` was silently ignored.** The rule emitter
  returned early on a missing identity, before it reached the palette.
- **`diagram-bar-contrast` warned about colours nobody sees.** On the light
  themes a palette tone replaces the theme table's mix, and the warning still
  judged the mix. Those themes are now left to `tone-contrast`.
- **An icon inside `::: cards` stayed text.** Card, overlay and dock bodies
  are rendered through `marked` during the parse, and the icon mode was set
  after it, in the pre-flight. It is set at the head of the parse now.
- **`lint.js` did not know `logo-print`.** The linter refused a key the build
  accepts – a valid deck failing CI. No single-feature deck used the key; the
  showcase deck did. A gate now holds the two identity tables to the same keys
  and enum words, and was checked by deleting the line again.

And one that was not code: the elevation branch had put its `--shadow-rest`
entry under a heading of its own in the middle of the changelog's *Added*
section, so every existing entry below it read as a ledger entry. It is one
bullet under *Fixed* now.

## What the plan got wrong, and what the build found instead

- **The `--check-fit` failure this plan predicted does not exist, and the
  reserve is why.** A chunk is centred in the padded row, so once the frame's
  band is padding, content that fits the usable box cannot reach the footer:
  the two conditions are arithmetically exclusive. What `--check-fit` needed
  was not a new finding but a **classification** – a chunk between the usable
  height and the viewport height was being filed as "fits the frame" when it
  is really "taller than the frame, read by scrolling". One line.
- **The real collision is the scroll, not the fit.** A chunk taller than the
  frame is walked down as its reveals advance, and its prose passes straight
  through the footer on the way – measured on a twelve-paragraph chunk, the
  fifth paragraph was drawn over the lecturer's name. No reserve can help:
  that chunk never fitted the band. The band fades to paper under the line
  instead.
- **The corner belongs to `::: marginalia`, not to `::: margin`.** Those are
  two constructs and only the first lives there; `::: margin` is the
  deprecated spelling of `::: footnote` and sits under the prose. The plan
  said the wrong one in five places.
- **`--shadow-rest` reaches further than `--shadow-float`.** Its second layer
  is `0 0.26em 0.85em`, so the *resting* step of the ladder is the tallest
  one: 1.11em against 1.04em, which at 900px and `body-scale: 1.8` is 46.8px
  of reach into 44.1px of padding. Pre-existing, unrelated to `elevation`, and
  on the gate's pending ledger rather than fixed, because both fixes move the
  look of every deck that exists.

## What bit, and what the next person should not redo

- **`diagram-core.mjs` must not carry an `import`, and must not carry anything
  the browser does not need.** `diagramCoreScript()` reads it as *text*,
  strips `export` and wraps the result in an IIFE. An import line survives
  that and is a syntax error inside a function body – the compiler fails to
  parse in every built page while every Node-side gate stays green. The first
  cut of `colour.mjs` extracted the chain out of that file and imported it
  back: 817 gate assertions passed and every deck would have been broken. The
  same splice is why `DG_BOX_FILLS` lives in `build.js` – a table added to
  `diagram-core.mjs` costs four views their bytes on every deck, 114 lines
  measured, for something the browser never reads.
- **Print has no `data-theme`.** `body[data-theme^=light]` matches nothing in
  a document, so the identity needs a third ground scoped to `body` itself,
  with print's own paper (`#fafaf7`) and ink. Print also hard-codes `#fff` on
  its accent grounds where the live views write `var(--paper)`.
- **Splitting a selector list on `,` breaks `:is()`.** `:is(strong, b)` and
  `:is(.overlay-card, .dock)` each carry one inside a bracket, and the halves
  after the split are not selectors – CSS drops them silently along with
  everything grouped with them. `splitSelectorList()` counts depth.
- **`position: fixed` in a print stylesheet is a screen defect.** It is the
  only thing that repeats per printed page, and on screen – where `print.html`
  is also read – it is a bar pinned over the last two lines, measured at 77px
  of overlap. The running foot belongs inside `@media print`.
- **Mix in oklab, never in oklch.** `color-mix(in oklab, …)` interpolates L, a
  and b; interpolating a hue linearly takes the short way round a circle and
  lands on a different colour. It was worth 0.11 of a contrast ratio on the
  first tone measured, which is a plausible number for the wrong colour.
- **`--emph-ink` looks like a cycle and is not.** `--ink: var(--emph-ink)` on
  a card, with `--emph-ink: var(--ink)` on the body, resolves: a custom
  property is substituted where it is *declared*, so what the card inherits is
  already resolved. Verified in a browser rather than argued.

## What the gates found that nobody was looking for

- `FRAME_HIDDEN_STATES` was missing `#link-overlay` and `#demo-overlay`. The
  gate derives the panel list from the stylesheet's own
  `#x.hidden { display: none }` rules, which is the only reason they turned up.
- The property sweep for stage-dimming classes found `figure-focused` and
  nothing else until it was taught that `body` can carry a pseudo-class before
  its class (`body:not([data-view=speaker]).blanked`). It then found `blanked`
  and `demo-live` as well.
- `colour.mjs` reproduces the four accent ratios `build.js` states in prose to
  within 0.05. The comment's numbers were taken against the per-theme tinted
  paper and `DG_THEMES` carries the untinted one, which is the whole of the
  difference and is written down beside the tolerance.

## The design pass

A second round against a real slide master – coloured boxes, a hard edge
under each, a prominent mark, and boxes that say what the reader is to do.

| branch | adds |
| --- | --- |
| `styling/frame` | the corner mark at slide-master size, against the frame's edges |
| `styling/elevation` | `elevation: offset` – a hard 45-degree edge in the box's own darker shade, and it prints |
| `styling/palette` | a `tone` slot on `::: cards` (`{.tone-2}`, `{.tones}`) – a slot beside the ground, not a seventh ground |
| `styling/icons` | an icon beside a card's bold heading is part of the heading and takes its colour |
| `styling/activity` | new: `::: activity link \| info \| task \| example`, with marks drawn by the build |

`--card-edge` is the one name the three edge-drawing features share: a tone,
an activity kind or a ground sets it, and `offset` and the boxes read it, so
none of them has to know the others exist.

What this round found:

- **A custom property holding `var(--emph)` must not be declared on `:root`.**
  It is substituted where it is declared, and the theme and a deck's identity
  set `--emph` on the body – so the info box and the default card tones drew
  the root's accent, ignored the house colour, and did not follow `A`. Both
  resolve on the element now, and both gates assert it.
- **`cycle` was the wrong word for a card row's tones.** It is the retired
  spelling of a looping `::: draw`, and the legacy-syntax gate refused it the
  moment it appeared in a brace tail. The word is `tones`.
- **The grounds stay six.** `CARDS_SLOTS` says so in as many words, so colour
  became its own slot instead.
- **Printable was measured.** A PDF printed without background graphics draws
  one more filled shape per card carrying the hard edge than the same deck
  without it.

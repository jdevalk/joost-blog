---
name: Joost.blog Specimen System
description: An editorial type-specimen system for long-form writing on SEO, WordPress, and the open web.
colors:
  ink: "#1f2530"
  ink-soft: "#4e5666"
  parchment: "#e4e2dc"
  parchment-2: "#dcdad3"
  parchment-3: "#d2d0c8"
  dusk: "#4a6480"
  terracotta: "#e08a5a"
  clay: "#a85c45"
  sage: "#6f8270"
  hero-bg: "#2c3447"
  hero-bg-deep: "#1f2530"
  field-bg-deep: "#0d1118"
typography:
  display:
    fontFamily: "Domaine Display, Georgia, serif"
    fontSize: "clamp(52px, 6vw, 88px)"
    fontWeight: 500
    lineHeight: 1.0
    letterSpacing: "-0.01em"
  headline:
    fontFamily: "Domaine Display, Georgia, serif"
    fontSize: "44px"
    fontWeight: 500
    lineHeight: 1.1
  title:
    fontFamily: "Domaine Display, Georgia, serif"
    fontSize: "22px"
    fontWeight: 500
    lineHeight: 1.2
  body:
    fontFamily: "Domaine Text, Georgia, serif"
    fontSize: "19px"
    fontWeight: 300
    lineHeight: 1.45
    fontFeature: "'ss01', 'cv11'"
  label:
    fontFamily: "Pitch, ui-monospace, monospace"
    fontSize: "11px"
    fontWeight: 400
    letterSpacing: "0.04em"
rounded:
  none: "0"
  pill: "50%"
  card: "8px"
spacing:
  xs: "8px"
  sm: "14px"
  md: "28px"
  lg: "40px"
  xl: "64px"
components:
  mark:
    backgroundColor: "{colors.hero-bg}"
    textColor: "{colors.parchment}"
    rounded: "{rounded.pill}"
    size: "44px"
  field:
    backgroundColor: "{colors.field-bg-deep}"
    textColor: "{colors.parchment}"
    rounded: "{rounded.none}"
    padding: "22px 24px"
---

# Design System: Joost.blog Specimen System

## 1. Overview

**Creative North Star: "The Type Specimen"**

This is a personal blog that wears its typography on the outside. Built on Klim Type Foundry's Domaine Display, Domaine Text, and Pitch, the system treats every page as a specimen sheet: the letterforms are the identity, and chrome stays out of their way. Ink-on-parchment is the resting state — a warm, slightly cool-gray paper field carrying near-black serif text — with a single terracotta accent earning its keep through rarity. The mood is editorial and confident, the voice of a craftsman who has been setting type and shipping software for twenty years.

It explicitly rejects the generic SaaS / dev-blog look: no cream-and-purple-gradient, no Inter or system-default type, no icon-heading-text card grids, no tiny tracked uppercase eyebrows or `01 / 02 / 03` numbered scaffolding above every section. Warmth comes from the typeface and the parchment, never from a default-tinted near-white background or a decorative gradient.

The system ships **eight named palettes** (slate is the default; putty, sage, bone, dusk, ink, ochre, ivory follow) that the reader can switch. Each is a complete ink / parchment / accent set, light and dark, so the identity survives recolouring — the type and rhythm carry it, not any one hue.

**Key Characteristics:**
- Serif-driven, type-first; chrome is minimal and quiet.
- One accent (terracotta) used sparingly against ink-on-parchment.
- Eight swappable palettes, each intentional in both light and dark.
- Editorial restraint: every visual element has to earn its place.

## 2. Colors

A warm-neutral paper field carrying near-black ink, with one terracotta accent and a slate-blue secondary. The named palettes recolour these roles without changing their structure.

### Primary
- **Dusk Slate** (#4a6480): The primary brand blue. Links in prose, heading rules, focus rings, the wordmark mark when slate is active.
- **Terracotta** (#e08a5a): The single warm accent. Heading left-rules, code-block rules, dark-mode link hover, small emphatic marks. Rare by doctrine.

### Secondary
- **Clay** (#a85c45) and **Sage** (#6f8270): Supporting swatches for editorial moments and palette accents; never compete with terracotta on the same surface.

### Neutral
- **Ink** (#1f2530): Primary text and hard 1px rules. Near-black with a cool cast — never pure `#000`.
- **Ink Soft** (#4e5666): Secondary text, captions, metadata. Holds ≥4.5:1 on parchment.
- **Parchment** (#e4e2dc), **Parchment-2** (#dcdad3), **Parchment-3** (#d2d0c8): The three-step paper field — page, surface, recessed.
- **Hero BG / Deep** (#2c3447 / #1f2530) and **Field BG Deep** (#0d1118): The dark slate grounds for hero blocks and code/field surfaces.

### Named Rules
**The One Accent Rule.** Terracotta appears on ≤10% of any surface. Its rarity is what makes it read as a deliberate mark rather than decoration. If two things on a screen are terracotta, one of them is wrong.

**The No Pure Black Rule.** Text is Ink (#1f2530), never `#000`. Backgrounds are tinted paper, never `#fff`. The cool-gray cast is the brand; flat black/white reads as unset defaults.

## 3. Typography

**Display Font:** Domaine Display (with Georgia, serif fallback), weight 500
**Body Font:** Domaine Text (with Georgia, serif fallback), weight 300
**Label/Mono Font:** Pitch (with ui-monospace, monospace), weight 400

**Character:** A high-contrast editorial serif pairing from one foundry — Display for voice, Text for reading — set against a low-key monospace for labels and code. The contrast axis is size and role, not family clash. Body runs light (300) and large (≈19px) for unhurried long-form reading; `ss01` and `cv11` stylistic sets are on globally.

### Hierarchy
- **Hero Display** (500, `clamp(52px–88px)`, lh 1.0, -0.01em): Page-level statement headings. A taller `clamp(96px–180px)` specimen variant exists for the home masthead — a deliberate specimen flourish, not a per-page default.
- **Headline** (500, 44px, lh ~1.1): Section and article titles.
- **Title** (500, 22px, lh ~1.2): Card titles, sub-section heads.
- **Body** (300, 19px, lh 1.45): Prose. Cap measure at 65–75ch.
- **Label** (400 mono, 11px, +0.04em, often uppercase): Metadata, eyebrows-as-data, field labels.

### Named Rules
**The Two-Family Rule.** Domaine (Display + Text) and Pitch. That is the whole type system. No third family, no Inter, no system-ui creeping in through a component.

**The Measure Rule.** Prose lines stay within 65–75ch. The reading column is sacred; widen the page chrome, never the text measure.

## 4. Elevation

Predominantly flat. Depth is conveyed by tonal layering across the three parchment steps and by the dark slate hero/field grounds, not by floating shadows. Two soft shadows exist for genuine lift (cards on hover, the avatar ring); they are ambient, never structural, and never the default resting state.

### Shadow Vocabulary
- **Card** (`0 1px 3px rgba(31,37,48,.05), 0 1px 2px rgba(31,37,48,.06)`): Barely-there resting lift on interactive cards.
- **Card Hover** (`0 14px 32px -6px rgba(31,37,48,.14), 0 8px 12px -6px rgba(31,37,48,.06)`): The lift earned on hover.
- **Avatar Ring** (`0 0 0 6px / 0 0 0 14px` tinted): Concentric brand ring around the portrait.

### Named Rules
**The Flat-At-Rest Rule.** Surfaces are flat by default. A shadow is a response to state (hover, focus), never decoration applied to a static element.

## 5. Components

### Buttons
- **Shape:** Square by default (0 radius); the system favours hard editorial corners over rounded pills.
- **Primary:** Ink or dusk ground with parchment text; generous horizontal padding.
- **Hover / Focus:** Background shift plus the `--shadow-button` focus ring (4px dusk at 20%). Keep transitions to color/opacity/transform.

### Cards / Containers
- **Corner Style:** 8px on the rare true card; most "cards" are borderless tonal blocks.
- **Background:** Parchment-2 / Parchment-3 against the Parchment page.
- **Shadow Strategy:** Flat at rest; Card → Card-Hover on interaction only.
- **Border:** Hairline `1px solid Ink` where definition is needed.

### Inputs / Fields (code & form surfaces)
- **Style:** Dark slate ground (Field BG Deep #0d1118), parchment text, square corners, Pitch mono.
- **Accent:** A terracotta left-rule marks code blocks — a deliberate brand signature, not a generic side-stripe.

### Navigation
- **Style:** Sticky parchment header, 1px ink bottom rule, Domaine wordmark + circular mark.
- **Behavior:** Shrink-on-scroll (header compresses ~40%). Reduced-motion users get the end state without the transition.

### Signature: The Heading Rule
`h2`/`h3` in prose carry a terracotta (light) / accent (dark) left rule, hung into the margin (`-ml-5`, `border-l-3`, `pl-[17px]`). This is the system's most recognisable mark and is intentional — distinct from the banned card side-stripe.

## 6. Do's and Don'ts

### Do:
- **Do** keep terracotta to ≤10% of any surface (The One Accent Rule).
- **Do** set text in Ink (#1f2530) on tinted parchment, never pure black on pure white.
- **Do** hold prose to a 65–75ch measure; widen chrome, not the reading column.
- **Do** keep both light and dark, and all eight palettes, feeling first-class — design for the role tokens, not one hue.
- **Do** give every animation (header shrink, card hover) a `prefers-reduced-motion` path.

### Don't:
- **Don't** introduce a third typeface or let Inter / system-ui in through a component. Domaine + Pitch only.
- **Don't** ship the generic SaaS / dev-blog look: cream-or-white body with a purple/blue gradient accent, icon-heading-text card grids.
- **Don't** add tiny uppercase tracked eyebrows or `01 / 02 / 03` numbered markers as section scaffolding.
- **Don't** use `background-clip: text` gradient text, decorative glassmorphism, or bounce/elastic easing.
- **Don't** mistake the intentional terracotta heading left-rule for a banned side-stripe — the ban is on colored side-stripes used as generic card/callout accents, not this signature mark.

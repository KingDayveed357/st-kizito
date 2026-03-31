# Design System Strategy: The Illuminated Digital Experience

## 1. Overview & Creative North Star
The Creative North Star for this design system is **"The Illuminated Manuscript."** 

In an era of noisy, cluttered interfaces, this system treats the screen as a sacred, quiet space—a digital chapel. We are moving away from the "app-like" feel of generic buttons and boxes toward a high-end editorial experience. The goal is to evoke the tactile quality of aged parchment and the warmth of candlelight. We achieve this through intentional asymmetry, massive breathing room (whitespace), and a rejection of traditional structural lines in favor of tonal depth. This is not just a utility; it is a vessel for reflection.

## 2. Colors & Tonal Depth
The palette is rooted in the `surface` (warm parchment) and punctuated by liturgical accents that serve as functional beacons.

### The "No-Line" Rule
Standard UI relies on 1px borders to separate content. **In this system, 1px solid borders are strictly prohibited for sectioning.** Boundaries must be defined solely through background color shifts. For example, a `surface-container-low` section should sit against a `surface` background to create a soft, organic edge.

### Surface Hierarchy & Nesting
Treat the UI as a series of physical layers—like stacked sheets of fine cotton paper.
- **Base Layer:** `surface` (#fcf9f3) for the main background.
- **Nesting:** Use `surface-container-low` (#f6f3ed) for secondary content areas and `surface-container-high` (#ebe8e2) for interactive elements that need to feel closer to the user.
- **Glassmorphism:** For floating navigation or modals, use `surface` with 80% opacity and a `20px` backdrop-blur. This allows the "warmth" of the background to bleed through, maintaining a sense of place.

### Signature Accents (The Liturgical Palette)
The accents are not just decorative; they are semantic. Use `primary` (#376847) for standard time, `secondary` (#6f518e) for Advent/Lent, and `tertiary_container` (#c9a84c) for feasts and solemnities. Use subtle gradients (e.g., `primary` to `primary_container`) on main action buttons to give them a "lit" quality, as if glowing by candlelight.

## 3. Typography
The typographic system creates a dialogue between the ancient (Serif) and the modern (Sans-Serif).

*   **Display & Headlines (Noto Serif):** Used for scripture, prayer titles, and liturgical text. These should feel authoritative and editorial. Use `display-lg` (3.5rem) with tighter tracking (-0.02em) to create a "signature" look on splash pages.
*   **UI & Utility (Inter):** Used for navigation, labels, and settings. This provides the functional clarity required for accessibility.
*   **Hierarchy as Identity:** Always lead with a Serif headline. The transition from a `headline-lg` (Serif) to a `body-md` (Sans) creates a sophisticated, high-contrast visual rhythm that separates "The Word" from "The Interface."

## 4. Elevation & Depth
We eschew traditional "drop shadows" in favor of **Tonal Layering**.

*   **The Layering Principle:** Depth is achieved by "stacking" surface tiers. A `surface-container-lowest` card placed on a `surface-container-low` background creates a natural lift without a single pixel of shadow.
*   **Ambient Shadows:** When a shadow is necessary for a floating CTA, use an extra-diffused "Ambient" shadow: `box-shadow: 0 12px 32px rgba(28, 28, 24, 0.05)`. The color is a tint of the `on-surface` token, not a neutral grey.
*   **The Ghost Border Fallback:** If a container needs more definition (e.g., in high-contrast mode), use a "Ghost Border": the `outline-variant` token at 15% opacity. Never use 100% opaque borders.

## 5. Components

### Cards & Collections
*   **Styling:** 16px radius (`xl` scale). No borders.
*   **Spacing:** Use `24px` (8.5rem in our scale) for outer margins.
*   **Separation:** Forbid the use of divider lines. Use vertical white space (spacing scale `6` or `8`) to separate list items. A list should feel like a series of intentional groupings, not a spreadsheet.

### Interactive Elements (CTAs)
*   **Primary Button:** Uses `primary` color with `on_primary` text. Minimum height: 48px. 
*   **Secondary/Tertiary:** Should be "Ghost" buttons—text only in `primary` or `secondary` with a subtle `surface-container-high` background on hover.
*   **Touch Targets:** All interactive elements must maintain a minimum 48px footprint to ensure accessibility for all parishioners.

### Liturgical Specific Components
*   **The "Candle" Progress Bar:** A thin, high-contrast bar using `tertiary_container` (#c9a84c) to track reading progress or donation goals, featuring a subtle outer glow.
*   **Sacred Quotes:** A specialized container with a `surface-container-lowest` background, featuring a `primary` color 4px left-accent bar (not a full border) and `headline-sm` serif text.

## 6. Do's and Don'ts

### Do
*   **Do** use asymmetrical layouts. For example, align a header to the left but place the body copy with a larger left-hand margin to create an editorial feel.
*   **Do** prioritize "Reading Mode." Ensure that when scripture or prayers are displayed, all UI (like the tab bar) fades to 30% opacity or hides completely.
*   **Do** use `surface_bright` to highlight "Active" states in lists rather than using a checkmark.

### Don't
*   **Don't** use pure black (#000000). Always use `on_surface` (#1c1c18) to maintain the "warm parchment" softness.
*   **Don't** crowd the screen. If a screen feels full, increase the spacing scale. In this system, space equals sanctity.
*   **Don't** use standard "Material Blue" for links. Use the liturgical `secondary` or `primary` accents to maintain the brand's dignity.

## 7. Spacing & Rhythm
Rhythm is controlled by the **8.5rem (24px) margin** standard. Every screen must breathe. Use the spacing scale to ensure that related items are tightly grouped (scale `2` or `3`) while distinct sections are widely separated (scale `10` or `12`). This creates a visual "hush" between different types of content.
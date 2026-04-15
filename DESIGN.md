# Design System Specification: Industrial Future

## 1. Overview & Creative North Star
**Creative North Star: The Monolithic Infrastructure**

This design system is engineered to reflect the gravity of deep-tech infrastructure. We are moving away from the "lightweight" feel of typical SaaS platforms toward a visual language that feels heavy, permanent, and high-stakes. The aesthetic is built on **Organic Brutalism**: a combination of massive, structural layouts (Brutalism) and the fluid, high-tech glow of battery chemistry (Organic).

To avoid a "templated" look, we utilize **Intentional Asymmetry**. Hero sections should not be perfectly centered; instead, use the 8.5rem (24) spacing token to create weighted "voids" that allow high-contrast typography to breathe. Elements should overlap—titles cutting into image containers or glass cards floating over technical schematics—to create a sense of three-dimensional depth and industrial complexity.

---

## 2. Colors & Surface Architecture

The palette is rooted in the "Black Mass"—the valuable material reclaimed from recycled batteries. It is deep, dense, and high-contrast.

### The "No-Line" Rule
**Explicit Instruction:** 1px solid borders are strictly prohibited for sectioning or container definition. Boundaries must be defined solely through background color shifts or tonal transitions.
- **Good:** A `surface-container-low` section sitting on a `background` (#131313).
- **Bad:** A `#FFFFFF` 1px border separating two sections.

### Surface Hierarchy & Nesting
Treat the UI as a series of physical layers. We use the Material surface tiers to "carve" hierarchy out of the darkness:
- **Base Layer:** `surface` (#131313) for the main body.
- **In-set Deep Depth:** `surface-container-lowest` (#0e0e0e) for "well" components or code blocks.
- **Elevated Logic:** `surface-container-high` (#2a2a2a) for interactive cards.
- **Peak Interaction:** `surface-container-highest` (#353534) for hover states or active dropdowns.

### The "Glass & Gradient" Rule
To convey "Deep Tech," use **Glassmorphism** for floating navigation and modal overlays. Apply `surface-container` colors at 60% opacity with a `20px` backdrop-blur. 
- **Signature Texture:** Primary CTAs should use a subtle linear gradient: `primary-container` (#00F5FF) to `primary-fixed-dim` (#00dce5) at a 135-degree angle. This adds a "lithium glow" that flat color cannot replicate.

---

## 3. Typography: Industrial Precision

The type system balances the technical rigidity of **Space Grotesk** with the functional clarity of **Inter**.

- **Display & Headlines (Space Grotesk):** These are your "Structural Beams." Use `display-lg` (3.5rem) with `letter-spacing: -0.04em` for a compressed, high-power look. Headlines should be bold and authoritative, signaling $100M+ scale.
- **Body & Titles (Inter):** These are the "Technical Manuals." Inter provides the readability required for supply-chain data and investment figures. 
- **Labels (Space Grotesk):** Use `label-sm` (0.6875rem) in all-caps with `letter-spacing: 0.1em` for metadata and technical tags. This mimics industrial stamping and serial numbers.

---

## 4. Elevation & Depth: Tonal Layering

Traditional drop shadows feel "web-like" and cheap. We achieve depth through atmospheric light and material stacking.

- **The Layering Principle:** Instead of a shadow, place a `surface-container-low` (#1c1b1b) card on top of a `surface` (#131313) background. The delta in hex value creates a "Soft Lift."
- **Ambient Shadows:** For high-level modals, use a shadow with a blur of `40px` and an opacity of `6%`. The shadow color must be the `surface-tint` (#00dce5) rather than black, creating a faint technical "aura."
- **The Ghost Border Fallback:** If a container requires a boundary (e.g., in a complex data grid), use the `outline-variant` (#3a494a) at 15% opacity. It should feel like a "hint" of a line, not a hard edge.

---

## 5. Components

### Buttons: The Power Units
- **Primary:** Gradient fill (`primary-container` to `primary-fixed-dim`). Text in `on-primary-fixed` (#002021). Corner radius: `md` (0.375rem).
- **Secondary:** Ghost variant. No background. `outline` (#849495) at 20% opacity. 
- **Interaction:** On hover, primary buttons should "glow" by increasing the shadow spread of the `primary` color.

### Data Chips: Technical Markers
- **Status:** Use `secondary` (#45f791) for "Active/Sustainable" and `error` (#ffb4ab) for "Alert/Depleted."
- **Style:** Small caps `label-md` typography. Background should be 10% opacity of the status color to maintain dark-mode legibility.

### Input Fields: The Console
- **Structure:** `surface-container-lowest` background. No border, only a 2px bottom-stroke of `outline-variant` that transforms into a `primary` glow on focus.
- **Text:** `body-md` in `on-surface`.

### Cards & Lists: The Ledger
- **Forbid dividers.** Use `1.4rem` (4) or `2rem` (6) vertical spacing to separate list items.
- **Nesting:** A card (`surface-container-high`) containing a list should have list items highlighted on hover using `surface-container-highest`.

### Contextual Component: The "Live Stream" Telemetry
- Since this is infrastructure, include a **Telemetry Module**. A small, scrolling micro-component showing live throughput or "Black Mass" processing metrics using `label-sm` typography and `secondary` (Emerald Green) sparklines.

---

## 6. Do’s and Don’ts

### Do:
- **Use Large Scale:** Contrast `display-lg` with `body-sm` to create an editorial, high-end feel.
- **Embrace the Dark:** Keep 90% of the UI in the `surface` to `surface-container-high` range.
- **Align to the Grid, then Break it:** Use the spacing scale strictly, but allow imagery to bleed off the edge of the screen to suggest "infinite infrastructure."

### Don’t:
- **No NGO Green:** Avoid large washes of light green. Emerald Green is a "pulse," not a background.
- **No Sharp Corners:** While industrial, the `0.375rem` (md) radius prevents the UI from feeling "hostile." Avoid `0px` corners.
- **No Grey Shadows:** Never use `#000000` or grey for shadows. Use tinted shadows to maintain the "Modern Dark" vibrancy.
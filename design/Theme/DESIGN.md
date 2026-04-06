# Design System Specification: The Architectural Perspective

## 1. Overview & Creative North Star: "The Digital Atheneum"
This design system moves beyond the standard SaaS "box-and-line" aesthetic. Our North Star is **The Digital Atheneum**—an environment that feels like a high-end, curated workspace rather than a chaotic utility. We achieve this through "Architectural Clarity": using light, depth, and sophisticated tonal shifts to guide the user’s eye.

Instead of rigid grids and harsh borders, we employ **Intentional Asymmetry** and **Layered Sophistication**. Large-scale typography acts as an anchor, while cards and navigation elements float in a pressurized, breathable space. We are building a platform for focus, where the UI recedes to let the user's projects take center stage.

---

## 2. Colors & Tonal Depth
We reject the "flat" web. Our color strategy utilizes the Material-inspired palette to create a sense of physical space and hierarchy without relying on outdated decorative elements.

### The "No-Line" Rule
**Explicit Instruction:** Designers are prohibited from using 1px solid borders to define sections. Boundaries must be established through:
1.  **Background Shifts:** Placing a `surface-container-low` component against a `surface` background.
2.  **Tonal Transitions:** Using `surface-container-highest` to draw the eye to interactive zones.
3.  **Negative Space:** Utilizing the spacing scale to create "invisible" containers.

### Surface Hierarchy & Nesting
Treat the UI as stacked sheets of fine, semi-translucent material.
*   **Base Layer:** `surface` (#f9f9ff) for the main application background.
*   **Navigation/Sidebar:** `surface-container-low` (#f1f3ff) to create a subtle recessed feel.
*   **Primary Content Cards:** `surface-container-lowest` (#ffffff) to make them "pop" forward.
*   **Active Modals/Overlays:** `surface-bright` with 80% opacity and a 20px backdrop-blur for a premium glass effect.

### Signature Textures
Main CTAs must use a linear gradient: `primary` (#003d9b) to `primary-container` (#0052cc) at a 135-degree angle. This provides a "jewel-toned" depth that feels high-end and interactive, distinguishing it from static status indicators.

---

## 3. Typography: Editorial Authority
We use **Inter** as our typographic backbone. It is a typeface of precision and modernism.

*   **The Display Scale:** Use `display-md` or `display-lg` for dashboard greetings or project titles. These should be set with a `-2%` letter-spacing to create a tight, editorial "locked-in" feel.
*   **The Hierarchy of Truth:**
    *   **Headlines (`headline-sm` to `headline-lg`):** Reserved for section headers. Use `on-surface` (#141b2c) for maximum contrast.
    *   **Body (`body-md`):** Our workhorse. Ensure a line-height of 1.5 to maintain readability during long project sessions.
    *   **Labels (`label-md`):** Used for metadata and statuses. Always uppercase with `+5%` letter-spacing to distinguish them from interactive text.

---

## 4. Elevation & Depth: Tonal Layering
We do not use shadows to "beautify"; we use them to communicate relative distance from the user.

*   **The Layering Principle:** Place a `surface-container-lowest` card on a `surface-container-low` section. This "lift" is purely tonal, creating a soft, natural distinction.
*   **Ambient Shadows:** For floating elements (Modals/Popovers), use a custom shadow:
    *   `box-shadow: 0 12px 40px rgba(20, 27, 44, 0.06);`
    *   The color is a tinted version of `on-surface` at a very low opacity to mimic natural light.
*   **The "Ghost Border" Fallback:** If accessibility requires a border (e.g., in high-contrast modes), use `outline-variant` (#c3c6d6) at 20% opacity. Never use 100% opaque borders.
*   **Glassmorphism:** For the Sidebar Navigation, apply a background of `surface_container_low` at 90% opacity with a `backdrop-filter: blur(12px)`. This integrates the sidebar into the background rather than cutting the layout in two.

---

## 5. Components: The Primitive Set

### Buttons & Interaction
*   **Primary:** Gradient of `primary` to `primary-container`, `rounded-md` (0.75rem), white text.
*   **Secondary:** No background, `outline` token at 20% opacity for the border, `on-surface-variant` text.
*   **States:** On hover, primary buttons should scale to 102% with a subtle increase in shadow spread—giving a "tactile press" feel.

### Status & Priority Chips
Status chips must use the `label-sm` typography. 
*   **To Do:** `surface-variant` background with `on-surface-variant` text.
*   **Working:** `secondary-fixed` background with `on-primary-fixed-variant` text.
*   **Done:** Use a custom "Success Green" gradient (#28A745 to #1E7E34) with `on-primary` text.

### Cards & Lists
*   **Constraint:** Forbid the use of divider lines. 
*   **Separation:** Separate list items using a `4` (1rem) spacing gap. If items need distinct containment, toggle the background of even-numbered items to `surface-container-low`.
*   **Radius:** All cards must use `rounded-md` (0.75rem) or `rounded-lg` (1rem) to maintain a friendly yet professional silhouette.

### Project-Specific Components
*   **The Progress Track:** A 4px thick line using `surface-variant` as the track and a `primary` gradient for the fill. No caps; the ends must be perfectly square for a modern, architectural look.
*   **The Priority Gauge:** A small 8x8px circle utilizing `tertiary` (#8c001d) for High/Critical, pulsating slightly (2s ease-in-out) to draw urgent attention without obstructing the view.

---

## 6. Do’s and Don’ts

### Do
*   **Do** embrace white space. If a layout feels "empty," increase the typography size rather than adding more boxes.
*   **Do** use `surface-container-highest` for hover states on list items to create a "magnification" effect.
*   **Do** align all text to a rigorous baseline grid to ensure the "Editorial" feel remains professional.

### Don’t
*   **Don’t** use pure black (#000000). Use `on-surface` (#141b2c) to maintain a high-end, ink-on-paper feel.
*   **Don’t** use shadows on every card. If everything floats, nothing is important. Use Tonal Layering first.
*   **Don’t** use standard "blue" for links. Use the `primary` token and an underline that is offset by 2px to ensure clear legibility.

---
*Document Version: 1.0.0 | Intent: Premium, Functional, Architectural.*
# Design System: The Gourmet Gallery

## 1. Overview & Creative North Star
The Creative North Star for this design system is **"The Gourmet Gallery."** 

We are moving away from the "utility-first" look of standard delivery apps and toward a high-end editorial experience. Instead of a rigid, claustrophobic grid of thumbnails, this system treats food like art. We achieve this through **Intentional Asymmetry**—where high-quality imagery occasionally breaks the container bounds—and **Layered Softness**. The goal is to make the user feel like they are flipping through a premium food magazine, creating a sense of relaxation and anticipation before the first bite.

The interface must feel "organic." We reject the cold, clinical lines of traditional tech and embrace the warmth of soft-touch surfaces and fluid transitions.

---

## 2. Colors
This palette is designed to be "appetizing." The oranges are deep and caramelized, not neon; the whites are creamy and soft, not stark.

### The "No-Line" Rule
**Explicit Instruction:** Designers are prohibited from using 1px solid borders to define sections or cards. Boundaries must be established through:
1.  **Background Color Shifts:** Placing a `surface-container-low` card on a `surface` background.
2.  **Tonal Transitions:** Using the hierarchy of surfaces to imply containment.
3.  **Shadow Depth:** Using ambient light to lift an element.

### Surface Hierarchy & Nesting
Treat the UI as a series of physical layers. We use a "Nesting" approach to define importance:
*   **Base:** `surface` (#fff4f0) - The canvas.
*   **Level 1 (Sections):** `surface-container-low` (#ffede5).
*   **Level 2 (Cards/Interactives):** `surface-container-lowest` (#ffffff).
*   **Level 3 (Floating/Pop-overs):** `surface-bright` with Glassmorphism.

### The "Glass & Gradient" Rule
To add a "signature" polish, use Glassmorphism for floating navigation bars or "Quick Add" buttons. Use a `backdrop-blur` of 20px-30px combined with a semi-transparent `surface-container-lowest` (80% opacity). 

For primary CTAs, use a subtle linear gradient from `primary` (#a33800) to `primary_container` (#ff7941) at a 135-degree angle. This provides a "sun-kissed" glow that flat colors lack.

---

## 3. Typography
We use a dual-font strategy to balance editorial authority with friendly modernism.

*   **Display & Headlines (`plusJakartaSans`):** Use these for moments of "Delight." Large scales (`display-lg` to `headline-sm`) should be tracked slightly tighter (-2%) to feel bespoke. These are your "Editorial Voice."
*   **Body & Labels (`beVietnamPro`):** These are for "Utility." They offer high legibility for menu descriptions and prices.

**Hierarchy as Identity:**
*   **Hero Prices:** Use `headline-md` for prices of featured items to give them a "premium boutique" feel.
*   **Descriptions:** Use `body-md` in `on_surface_variant` (#805032) to keep the layout feeling light and airy.

---

## 4. Elevation & Depth
Depth in this system is achieved through **Tonal Layering**, not structural lines.

*   **The Layering Principle:** To create a card, do not draw a box. Instead, place a `surface-container-lowest` shape onto a `surface-container-low` background. The subtle 2% difference in hex value is enough to guide the eye without adding visual noise.
*   **Ambient Shadows:** For floating elements (like a "Track Order" snackbar), use a shadow with a blur of 40px and an opacity of 6%. The shadow color must be a tinted version of `on-surface` (#4b240a), making it feel like a natural shadow cast on a warm table.
*   **The "Ghost Border" Fallback:** If a border is required for accessibility (e.g., in a high-glare environment), use the `outline-variant` token at **15% opacity**. Never use 100% opacity for lines.
*   **Organic Overlaps:** Allow food photography to "break out" of its `lg` (2rem) rounded container. A splash of sauce or a stray garnish overlapping the text creates a 3D, appetizing effect.

---

## 5. Components

### Buttons
*   **Primary:** Uses the "Signature Gradient" (Primary to Primary-Container). Shape: `full` (pill). Text: `on_primary`.
*   **Secondary:** `surface-container-highest` background with `primary` text. No border.
*   **Tertiary:** Ghost style. No background, `primary` text, high-weight `label-md`.

### Cards & Lists
*   **The "Editorial Card":** A `surface-container-lowest` base with `xl` (3rem) rounded corners on the top-left and bottom-right, and `lg` (2rem) on the others to create a custom, organic shape. 
*   **Zero-Divider Lists:** Forbid the use of line dividers. Separate menu items using `spacing-4` (vertical white space) or by alternating background tones between `surface` and `surface-container-low`.

### Chips (Filters)
*   **Unselected:** `surface-container-high` background, `on_surface` text.
*   **Selected:** `primary` background, `on_primary` text. Use `full` roundedness.

### Input Fields
*   **Style:** Minimalist. Use `surface-container-low` as the fill. No border. When focused, the background shifts to `surface-container-lowest` with a "Ghost Border" of `primary` at 20% opacity.

### The "Appetite Header" (Unique Component)
A large-scale component for restaurant pages. It uses a `display-sm` title overlapping a high-resolution hero image that has a soft `surface` fade at the bottom.

---

## 6. Do's and Don'ts

### Do:
*   **Do** use asymmetrical margins. If a photo is left-aligned, try right-aligning the description text to create "Editorial Flow."
*   **Do** use the `xl` (3rem) corner radius for large hero images to emphasize "Softness."
*   **Do** use `primary_fixed_dim` for icons to give them a "cooked/warm" orange glow.

### Don't:
*   **Don't** use pure black (#000000) for text. Always use `on_surface` (#4b240a) to maintain the "Warm & Delicious" vibe.
*   **Don't** use standard Material Design drop shadows. They are too heavy and "techy" for a food experience.
*   **Don't** use 90-degree corners. Everything must be rounded to evoke "Relaxation."
*   **Don't** crowd the interface. If you think there is enough white space, add 15% more. High-end dining is never crowded.
# Design System Document: Modern-Vintage Editorial

## 1. Overview & Creative North Star: "The Gourmet Post"
The Creative North Star for this design system is **The Gourmet Post**. This vision reconciles the high-energy, tactile nostalgia of a 1950s American diner with the refined, spacious elegance of a modern culinary editorial. 

We break the "standard digital template" by treating the screen like a physical tabletop or a premium broadsheet menu. Instead of rigid, symmetrical grids, we utilize **intentional overlapping**, **sticker-style layering**, and **asymmetrical focal points**. The UI should feel like it was hand-assembled—playful and mascot-driven, yet executed with the precision of a high-end design studio.

---

## 2. Colors & Surface Philosophy
The palette is rooted in a "Cream & Ink" foundation, punctuated by "Condiment" accents. 

### Palette Application
- **Background (`#fff9e7`):** This is our "Paper." It is never pure white. It must feel like heavy-weight, uncoated stock.
- **Primary (`#a60002`):** Our "Ketchup Red." Used for high-action CTAs and brand moments.
- **Secondary (`#845400`):** Our "Mustard/Cheese." Use this for promotional highlights and selection states.
- **Surface Tiers:** Use `surface_container_low` (`#f9f4e0`) for secondary content areas and `surface_container_highest` (`#e8e2cf`) for deep-set interactive wells.

### The Rules of Engagement
*   **The "No-Line" Rule:** Standard 1px solid borders are strictly prohibited for sectioning. Boundaries are created through background shifts or the **Checkerboard Divider**.
*   **The Checkerboard Divider:** To separate major sections, use a custom tile pattern (using `on_surface` and `surface`) at `0.7rem` (Spacing 2) height. It is a graphic element, not a CSS border.
*   **Signature Textures:** All large surface areas (Background and Surface Containers) must apply a 2% opacity "Ink Grain" noise texture overlay to kill the "digital flatness."
*   **The "Glass & Gradient" Rule:** Use `surface_tint` at 5% opacity with a `12px` backdrop blur for floating navigation bars. This creates a "frosted wax paper" effect that feels premium and tactile.

---

## 3. Typography: The Poster Aesthetic
Our typography is a dialogue between the loud, condensed energy of a vintage poster and the legible, airy precision of modern UI.

*   **Display & Headline (Epilogue):** Set to Bold or Extra Bold. For `display-lg` and `headline-lg`, use `text-transform: uppercase` and `letter-spacing: -0.02em`. This mimics the woodblock printing of mid-century menus.
*   **Body & Labels (Manrope):** These are our "Workhorses." Keep these clean with generous line-height (1.5x) to provide a sophisticated counter-balance to the aggressive headings.
*   **Visual Hierarchy:** Use `primary` (Red) for high-impact headlines to draw the eye, while using `on_surface_variant` for meta-data to keep the layout from feeling cluttered.

---

## 4. Elevation & Depth: The Sticker Effect
We move away from Material Design's "light source" elevation and toward a **3D Sticker Aesthetic**.

*   **The Layering Principle:** Depth is achieved by stacking `surface_container_lowest` cards onto `surface` backgrounds. 
*   **Ambient Shadows:** For floating elements (like a "Cart" FAB), use a "Hard-Soft" shadow.
    *   *Offset:* `4px 4px`
    *   *Blur:* `12px`
    *   *Color:* `on_surface` at 10% opacity. 
    *   *Result:* It should look like a thick piece of cardstock hovering just above the paper.
*   **The "Ghost Border" Fallback:** If a container sits on a background of a similar hue, use the `outline_variant` token at **15% opacity**. It should be felt, not seen.
*   **Large Roundedness:** Apply `xl` (`3rem`) to hero images and `lg` (`2rem`) to main cards. This "over-rounded" look communicates the playful, friendly nature of the brand.

---

## 5. Components

### Buttons
- **Primary:** Background `primary`, text `on_primary`. Roundedness: `full`. No shadow on rest; on hover, apply the "Sticker" shadow and a `-2px` Y-axis shift to simulate "lifting" off the page.
- **Secondary:** Background `secondary_container`, text `on_secondary_container`. Use for "Add to Cart" or "Customize."

### Cards
- **Forbid Divider Lines:** Use `3.5rem` (Spacing 10) of vertical whitespace to separate card groups.
- **Construction:** A card should be a `surface_container_lowest` shape with an `lg` corner radius. 
- **The Mascot Overlay:** High-end editorial layouts should feature the brand mascot partially overlapping the card edge (using absolute positioning) to break the "grid container" feel.

### Input Fields
- **Styling:** Use `surface_container_high` for the input fill. 
- **States:** On focus, the border doesn't just change color; the card gains a `2px` solid `primary` stroke to mimic a bold ink pen stroke.

### Specialized Component: The "Order Ticket"
A vertical list component using a "jagged edge" (zigzag) mask at the bottom, utilizing `surface_container_lowest`. Use `label-md` in all-caps for item names to mimic a kitchen receipt.

---

## 6. Do’s and Don’ts

### Do:
- **Do** lean into asymmetry. Place a large burger image 20px off-center to create visual energy.
- **Do** use the `secondary` (Yellow) for "New" or "Sale" badges, styled like a physical price sticker.
- **Do** ensure all headings have enough "breathing room"—at least `2rem` (Spacing 6) from the nearest body text.

### Don't:
- **Don't** use pure black (`#000000`). Only use `on_surface` (`#1e1c10`) to maintain the "Ink on Paper" warmth.
- **Don't** use standard Material shadows. If it doesn't look like a physical sticker or a stacked menu, it’s too "techy."
- **Don't** use icons without a slightly rounded, "chunky" stroke weight to match the `Epilogue` typeface.
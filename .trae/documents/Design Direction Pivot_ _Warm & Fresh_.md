# Design Direction Pivot: "Warm & Fresh" (温馨清新系)

I understand. The previous "Light Luxury" (Gold/Champagne) was too heavy. I will completely overhaul the color system to match your request for a **"Warm & Fresh"** aesthetic.

## 🎨 New Design Concept: "Morning Breeze" (晨风)

*   **Core Vibe**: Cozy, Airy, Natural, Soft.
*   **Key Colors**:
    *   **Warmth**: Cream (`#FEFDF5`), Soft Coral (`#FFB7B2`).
    *   **Freshness**: Mint Green (`#98DDCA`), Sky Blue (`#B5EAEA`).
*   **Theme Color**: **Fresh Mint Green (`#42B983`)** or **Warm Coral**. I will use **Fresh Mint (`#10B981`)** as the primary anchor, as it bridges "Fresh" and "Warm" backgrounds perfectly.

## Implementation Details

### 1. Color System Overhaul (`tailwind.config.js`)
*   **Day Background**: Shift from "Porcelain" to **"Warm Cream" (`#FEFDF5`)**.
*   **Day Gradient**: **"Cream to Mint"** (`linear-gradient(135deg, #FDFAF3 0%, #E8F5E9 100%)`). This creates a subtle, natural transition that feels like a garden in the morning.
*   **Night Gradient**: **"Deep Forest"** (`linear-gradient(135deg, #0F2027 0%, #203A43 50%, #2C5364 100%)`). A cool, calm, nature-inspired dark mode, rather than stark black or navy.
*   **Palette**: Introduce a `fresh` palette replacing `luxury`.

### 2. Styling Updates (`style.js`)
*   **Progress Bar**: Update to a **"Mint to Sky"** gradient (`#42B983` -> `#00B4DB`), which is energetic and fresh.
*   **Default Theme Color**: Change from Gold (`#C5A059`) to **Fresh Green (`#10B981`)** or **Warm Blue**.

### 3. Verification
*   Ensure the text contrast remains high on the new warmer/lighter backgrounds.

I will update `tailwind.config.js` and `themes/hexo/style.js` immediately.

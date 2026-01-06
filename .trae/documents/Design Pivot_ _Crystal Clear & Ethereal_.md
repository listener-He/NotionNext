# Design Pivot: "Crystal Clear & Ethereal" (晶莹剔透、极致清新)

I understand. The previous "Warm/Cream" might still feel too "warm/yellow" or "dense." You want **"High-Definition, Exquisite, Airy"** (高清、精致、通透).

## 🎨 New Design Concept: "Glass & Air" (光与气)

*   **Core Philosophy**: **Transparency, Lightness, Neutrality**.
    *   Reduce "Color Weight": Use **Pure White (`#FFFFFF`)** and **Cool Grays** as the base to maximize compatibility with any cover image.
    *   **"Airy" Gradients**: Extremely subtle, barely-there gradients that feel like light hitting glass, rather than painted colors.
*   **Key Colors**:
    *   **Background**: **Pure White (`#FFFFFF`)** with a hint of **Cool Blue** (`#F0F9FF`) in gradients.
    *   **Theme Color**: **"Crystal Blue" (`#3B82F6`)** or **"Cyan" (`#06B6D4`)** — clear, sharp, digital. I will use **"Sky Blue" (`#38BDF8`)** for that "high-definition" feel.
    *   **Night Mode**: **"Deep Space" (`#020617`)** — Pure, deep black/blue, minimizing "muddy" gray tones.

## Implementation Details

### 1. Color System "Detox" (`tailwind.config.js`)
*   **Remove Warmth**: Eliminate Cream/Beige tones. Switch to **Cool/Neutral** bases.
*   **Day Gradient**: **"Morning Mist"** (`linear-gradient(180deg, #FFFFFF 0%, #F0F9FF 100%)`). Very subtle, mostly white, just a hint of freshness at the bottom.
*   **Night Gradient**: **"Starry Night"** (`linear-gradient(180deg, #020617 0%, #0F172A 100%)`).
*   **Glassmorphism**: Increase transparency (lower opacity) and increase blur (higher `backdrop-filter`) to make UI elements feel like **"Crystal"** rather than "Frosted Plastic."

### 2. Styling Refinement (`style.js`)
*   **Theme Color**: Update to **Sky Blue (`#38BDF8`)**.
*   **Progress Bar**: **"Invisible" to "Visible"** gradient (Transparent -> Blue).
*   **Card Styling**: Reduce border opacity, increase shadow diffusion (make shadows softer and more spread out) for a "floating" look.

### 3. Visual "HD" Tuning
*   **Text**: Use `text-gray-800` (instead of black) on white for sharp but comfortable contrast.
*   **Borders**: Use ultra-thin, ultra-light borders (`border-slate-100`) to define edges without visual weight.

I will strip away the "heavy" warm tones and implement this "Crystal Clear" aesthetic immediately.

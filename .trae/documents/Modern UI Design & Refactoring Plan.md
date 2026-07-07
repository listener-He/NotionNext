# Modern User Interface Design and Refactoring Plan

I have analyzed the codebase and identified conflicts and design opportunities within it. Below is a plan to upgrade the vision system to a "top-tier modern" standard.

1. Design concept: "Mist-like Atmosphere" (Day Mode)

We will abandon the traditional linear gradient (which seems outdated) and adopt a **dynamic grid gradient** instead.

**Visual style**: Based on a colorful, clean, and tidy tone, it does not appear like a solid wall with vibrant colors, but rather like light passing through a prism.

* **Color Palette (Daytime)**:
  * Base color: `#F9FAFB` (cool grayish white).
    Gradient logic:
    Cool Blue (#E0F2FE) → Neutral Lavender (#F3E8FF) → Warm Mint (#F0FDFA)
    (In line with the natural flow of light from cool to warm) creates a "breathing" effect.
    Saturation < 8% (to avoid glare and comply with Material Design 3 standards)
    No hard edges: Accurate calculation of gradient stops (0%/50%/100%), achieving seamless visual effects

1. Conflict resolution and code cleanup

Currently, `bg-day-gradient` is defined in **two places**, which leads to abnormal behavior:

1. `styles/globals.css` (Radial Grid - **Retain and Improve)**
2. `tailwind.config.js` (Linear Gradient - **Deleted**)

**Operation**: I will remove the definitions in `tailwind.config.js` to allow the more advanced CSS implementation in `globals.css` to take full control.

1. Component coordination

* **Homepage Wave Chart (`Wave.js`)：**
  * Currently, the wave has formed a distinct "cut" at the bottom of the head.
    **Fix**: Update the SVG gradient stops to fully match the new "Ethereal Breath" color palette. The waves will appear as if they are integrated into the content, resembling frosted glass.
* **Glass card**:
  * Ensure that the glass texture on the postcard stands out in sharp contrast against the new, lighter, and more transparent background.

## Execution steps

1. **Cleanup**: Remove the conflicting `.bg-day-gradient` and `.bg-night-gradient` from `tailwind.config.js`.
2. **Implementation**: Rewrite `.bg-day-gradient` in `styles/globals.css` using the new "Ethereal Breath" grid design.
3. **Synchronization**: Update `Wave.js` to use the exact same color palette for a seamless transition.
4. **Validation**: Ensure that no other CSS overrides (such as those in `themes/hexo/style.js`) are preventing these new styles from taking effect.

Should I proceed with this major design overhaul?

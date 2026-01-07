# Extract Wave Component and Improve Hero Transition

I will improve the `Hero` component's wave animation by extracting it into a reusable `Wave` component and adjusting the styling to create a seamless transition between the cover image and the content below, eliminating the "white line" artifact.

## Implementation Steps

1.  **Create `Wave` Component**:
    *   Create a new file `themes/hexo/components/Wave.js`.
    *   Implement the wave SVG structure with 4 parallax wave layers.
    *   **Crucial Change**: Configure the wave layers so that the layer connecting to the content is **solid** (100% opacity) and matches the page background color.
        *   Light Mode: `fill-white` (#FFFFFF)
        *   Dark Mode: `dark:fill-[#18171d]` (Matches the Hexo theme dark background)
    *   Retain the existing animation classes but ensure they work with the new color configuration.

2.  **Refactor `Hero` Component**:
    *   Modify `themes/hexo/components/Hero.js`.
    *   Import the new `Wave` component.
    *   Remove the duplicate inline SVG code blocks (currently present in both the `if (!isClient)` block and the main return).
    *   Place the `<Wave />` component at the absolute bottom of the header container.

3.  **Styling Adjustments**:
    *   Ensure the `Wave` component has `w-full` and `absolute bottom-0` to sit flush against the next section.
    *   Add `z-10` to ensure it sits above the hero image but below any interactive text/buttons if necessary (or above image to mask it).

## Technical Details
*   **Colors**: The solid wave will use `fill-white` for light mode and `dark:fill-[#18171d]` for dark mode to match `themes/hexo/style.js` settings.
*   **Animation**: Will reuse the existing `.waves` and `.parallax` animations defined in `styles/globals.css`, as they provide the desired movement.
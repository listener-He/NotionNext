# Design System Documentation

## Overview
This document outlines the design system for NotionNext, featuring a modern, "Crystal Sky Blue" aesthetic. The system uses Tailwind CSS as the engine and CSS Variables for dynamic theming.

## 1. Color System

### Semantic Palette
We use a semantic naming convention to ensure consistency and themeability.

| Token | CSS Variable | Tailwind Class | Description |
|-------|--------------|----------------|-------------|
| **Primary** | `--color-primary-*` | `bg-primary-400` | Main brand color (Sky Blue). Used for actions, links, and highlights. |
| **Secondary** | `--color-secondary-*` | `bg-secondary-500` | Supporting color (Slate). Used for subtle UI elements. |
| **Neutral** | `--color-neutral-*` | `bg-neutral-100` | Grays for backgrounds, borders, and text. |
| **Success** | `--color-success` | `text-success` | Positive states (Emerald). |
| **Warning** | `--color-warning` | `text-warning` | Cautionary states (Amber). |
| **Error** | `--color-error` | `text-error` | Destructive/Error states (Red). |

### Intent Variables (Theming)
These variables automatically adapt based on light/dark mode.

- `--color-bg-base`: Page background.
- `--color-bg-card`: Card/Container background.
- `--color-text-primary`: Main text color.
- `--color-text-secondary`: Subtitle/muted text color.
- `--color-border`: Border color.

### Brand Gradients
- `bg-day-gradient`: Subtle white-to-gray gradient for light mode.
- `bg-night-gradient`: Deep space gradient for dark mode.
- `--brand-start` / `--brand-end`: Dynamic gradient stops.

## 2. Typography

### Font Stack
- **Sans**: `Inter`, `Noto Sans SC`, system-ui.
- **Serif**: `Playfair Display`, `Noto Serif SC`.
- **Mono**: `JetBrains Mono`.

### Scale
- `text-xs` to `text-3xl` follows standard Tailwind scale.
- Headings (`h1`, `h2`) in `themes/hexo` have specific overrides for "High Definition" rendering (tighter tracking, specific weights).

## 3. Spacing & Layout

- **Grid**: 4px baseline.
- **Container**: Centered, max-width based on breakpoints (`sm` to `2xl`).
- **Glassmorphism**:
  - Utility: `.glassmorphism`
  - Variables: `--surface`, `--surface-border`

## 4. Shadows (Elevation)

| Class | CSS Variable | Usage |
|-------|--------------|-------|
| `shadow-elevation-sm` | `--shadow-elevation-sm` | Small components, buttons. |
| `shadow-elevation-md` | `--shadow-elevation-md` | Cards, dropdowns (hover state). |
| `shadow-elevation-lg` | `--shadow-elevation-lg` | Modals, floating elements. |

## 5. Component Guidelines

### Buttons
- Use `bg-primary-400` for primary actions.
- Add `hover:scale-105 active:scale-95` for micro-interactions.
- Use `rounded-lg` or `rounded-xl` for modern feel.

### Cards
- Use `.card-base` or `.glassmorphism`.
- Apply `card-focus-gradient` for cyberpunk/focus effects.

### Inputs
- Focus state should use `ring-2 ring-primary-200`.

## 6. Development Workflow

1. **Tailwind Config**: Defined in `tailwind.config.js`.
2. **Global Variables**: Defined in `styles/globals.css`.
3. **Theme Overrides**: Injected via `themes/hexo/style.js`.

When creating new components, prefer **Tailwind Utility Classes** over inline styles. Use the semantic color names (`primary`, `neutral`) instead of hardcoded hex values.

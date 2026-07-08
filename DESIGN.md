---
name: Premium E-Pharmacy Narrative
colors:
  surface: '#f8f9fa'
  surface-dim: '#d9dadb'
  surface-bright: '#f8f9fa'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f3f4f5'
  surface-container: '#edeeef'
  surface-container-high: '#e7e8e9'
  surface-container-highest: '#e1e3e4'
  on-surface: '#191c1d'
  on-surface-variant: '#3c4a42'
  inverse-surface: '#2e3132'
  inverse-on-surface: '#f0f1f2'
  outline: '#6c7a71'
  outline-variant: '#bbcabf'
  surface-tint: '#006c49'
  primary: '#006c49'
  on-primary: '#ffffff'
  primary-container: '#10b981'
  on-primary-container: '#00422b'
  inverse-primary: '#4edea3'
  secondary: '#006a61'
  on-secondary: '#ffffff'
  secondary-container: '#86f2e4'
  on-secondary-container: '#006f66'
  tertiary: '#50616b'
  on-tertiary: '#ffffff'
  tertiary-container: '#94a5b0'
  on-tertiary-container: '#2b3b44'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#6ffbbe'
  primary-fixed-dim: '#4edea3'
  on-primary-fixed: '#002113'
  on-primary-fixed-variant: '#005236'
  secondary-fixed: '#89f5e7'
  secondary-fixed-dim: '#6bd8cb'
  on-secondary-fixed: '#00201d'
  on-secondary-fixed-variant: '#005049'
  tertiary-fixed: '#d3e5f1'
  tertiary-fixed-dim: '#b7c9d5'
  on-tertiary-fixed: '#0c1e26'
  on-tertiary-fixed-variant: '#384953'
  background: '#f8f9fa'
  on-background: '#191c1d'
  surface-variant: '#e1e3e4'
typography:
  display-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 26px
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 22px
  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.01em
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 22px
    fontWeight: '600'
    lineHeight: 28px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 4px
  xs: 8px
  sm: 12px
  md: 16px
  lg: 24px
  xl: 32px
  container-margin: 20px
  gutter: 16px
---

## Brand & Style

The design system is anchored in a **Premium Minimalist** aesthetic, specifically tailored for a high-end e-pharmacy experience. It prioritizes clarity, clinical precision, and an atmosphere of calm reliability. The target audience seeks a frictionless, trustworthy healthcare journey that feels more like a wellness boutique than a traditional drug store.

The visual language utilizes a "Soft-Modern" approach:
- **Whitespace as a Utility:** Generous padding and margins are used to reduce cognitive load, essential for users navigating medical information.
- **Clinical Warmth:** While the interface is clean and predominantly white, the use of teal and emerald gradients provides a sense of vitality and professional care.
- **Precision Iconography:** Thin-line medical icons (1.5px stroke) ensure the UI feels sophisticated and lightweight.

## Colors

This design system utilizes a palette that evokes health, hygiene, and growth.

- **Primary & Secondary:** A gradient transition between Emerald (#10B981) and Teal (#0D9488) is used for primary actions, signifying professional medical authority.
- **Accent Surfaces:** Light Blue (#E0F2FE) is reserved for subtle highlights, background tints for specific categories, and "Selection" states.
- **Neutrals:** The canvas is Pure White (#FFFFFF). Sectioning is achieved through the use of an Ultra-Light Gray (#F9FAFB), creating a "layered paper" effect rather than using harsh lines.
- **Typography:** Deep Charcoal (#1F2937) ensures high legibility for headings, while Slate Gray (#4B5563) maintains a softer, secondary hierarchy for descriptions and metadata.

## Typography

The typography system relies exclusively on **Inter**, chosen for its exceptional legibility in medical contexts and its neutral, systematic character.

- **Hierarchy:** We use a strict semi-bold (600) weight for all headings to ensure they anchor the page sections. 
- **Readability:** Body text uses a generous 1.6x line-height ratio to ensure pharmacological terms and instructions are easy to parse.
- **Scale:** On mobile devices, the `headline-lg` scales down to 22px to prevent awkward text wrapping in narrow product cards.

## Layout & Spacing

The design system employs a **Fluid Grid** model with high internal breathing room.

- **Grid:** A 12-column grid for desktop and a 4-column grid for mobile. 
- **Margins:** Standard mobile horizontal margins are set to 20px to accommodate the large corner radii of cards.
- **Rhythm:** Spacing follows a 4px baseline. Components like product cards use `lg` (24px) internal padding to maintain the premium, spacious feel.
- **Reflow:** On tablet/desktop, product grids expand from 2 columns to 4 or 6, maintaining a fixed gutter of 16px.

## Elevation & Depth

Hierarchy is established through **Ambient Shadows** and **Tonal Layers**.

- **Surfaces:** Secondary sections use the Neutral (#F9FAFB) color to sit "behind" the primary content cards.
- **Shadows:** We avoid harsh shadows. Instead, we use a "Clinical Soft" shadow: `0px 10px 30px rgba(31, 41, 55, 0.05)`. This creates a floating effect that feels light and sterile.
- **Interaction:** Elevated elements (like active cards or buttons) increase their shadow spread slightly on hover/active states to provide tactile feedback.

## Shapes

The shape language is defined by **High Circularity**.

- **Large Radii:** Standard cards and containers use a 16px (`rounded-lg`) radius. Large promotional banners or modal sheets use 24px (`rounded-xl`).
- **Interactive Elements:** Buttons and Input fields follow the 12px-16px range to ensure a friendly, approachable touch-target.
- **Consistency:** All nested elements (like product images inside cards) must follow a proportional radius (usually 4-8px smaller than the parent) to maintain visual harmony.

## Components

### Buttons
Primary buttons use the Emerald-to-Teal horizontal gradient with white text. They feature a 16px border radius and a height of 52px for mobile accessibility. Secondary buttons are "Ghost" style with a Teal border or a Light Blue background.

### Product Cards
Cards are the core of the experience. They feature a Pure White background, a subtle 1px border in `#F3F4F6`, and the "Clinical Soft" shadow. Images are centered with a 12px padding from the card edge.

### Search Bars
Large, 56px height inputs with a 16px radius. They use a soft shadow instead of a heavy border to appear as if they are part of the header surface. Use a "Search" icon in Slate Gray.

### Status Chips
- **In Stock:** Mint Green background with Emerald text.
- **Prescription Required:** Light Blue background with Teal text.
- **Out of Stock:** Light Gray background with Deep Charcoal text.
- *Styling:* All chips are pill-shaped (32px radius) with `label-md` typography.

### Bottom Navigation
A fixed blur-background (Glassmorphism) bar. The active state is indicated by a primary teal icon and a subtle 4px dot below the label.

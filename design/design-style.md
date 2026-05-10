# HorusVis UI Style Guide

## 1. Style Direction

HorusVis uses a premium enterprise dashboard style with an architectural, editorial feel.
The visual language is calm, structured, and data-forward, with soft tonal layering instead of hard separators.

Core personality traits:

- Professional and trustworthy
- Clean and analytical
- Focused on clarity, not decoration
- Modern with subtle depth

## 2. Design Principles

### 2.1 Tonal Layering Over Borders

The system avoids heavy 1px outlines for structure. Layout separation is created by:

- Surface color steps
- Spacing and grouping
- Occasional low-opacity divider use only when needed

### 2.2 No Visual Noise

Interfaces prioritize readability:

- Spacious padding
- Clear hierarchy
- Minimal ornamentation
- Controlled icon use

### 2.3 Editorial Hierarchy

Titles are bold and compact with tight tracking. Labels are uppercase with wide tracking. Body text remains neutral and readable.

## 3. Color System

Shared palette is consistent across Admin, Projects, My Tasks, and Reports.

### 3.1 Key Neutrals and Surfaces

- surface: #f9f9ff
- surface-container-low: #f1f3ff
- surface-container-lowest: #ffffff
- surface-container-highest: #dbe2f9
- on-surface: #141b2c
- on-surface-variant: #434654
- outline: #737685
- outline-variant: #c3c6d6

### 3.2 Brand and Semantic Colors

- primary: #003d9b
- primary-container: #0052cc
- secondary: #525f73
- tertiary: #8c001d
- error: #ba1a1a
- success accents: #28A745 and #1E7E34

### 3.3 Signature Treatment

Primary CTAs and key progress fills use a blue gradient:

- linear-gradient(135deg, #003d9b 0%, #0052cc 100%)

## 4. Typography

- Typeface: Inter (weights 300 to 900)
- Headings: bold to black, often tight letter spacing
- Body: medium contrast, comfortable line-height
- Labels/metadata: uppercase, small size, wide tracking

Practical pattern:

- Page titles: 30 to 36px, heavy weight
- Section headers: 18 to 24px, bold
- Label text: 10 to 12px, uppercase tracking
- Body and table text: 12 to 16px

## 5. Layout and Structure

### 5.1 App Shell

- Fixed left sidebar (~256px)
- Sticky top bar in content area
- Main canvas uses large internal spacing and centered max-width containers

### 5.2 Navigation Pattern

- Active sidebar item: white background, blue text, stronger weight, soft shadow
- Inactive items: muted gray text with soft hover background
- Utility links (Help, Settings): anchored to sidebar bottom

### 5.3 Content Organization

- Dashboard-like sections grouped in cards
- Grid-first composition (stats rows, board columns, chart panes)
- Most cards use rounded corners (0.75rem typical)

## 6. Component Language

### 6.1 Cards

- Background: mostly surface-container-lowest
- Radius: rounded-xl dominant
- Border: very light (often outline-variant with low opacity) or none
- Shadow: subtle and selective (not global)

### 6.2 Buttons

- Primary: blue gradient, white text, medium-large radius, light shadow
- Secondary: tonal background or light border
- Common behavior: slight scale on hover/press

### 6.3 Status and Priority

- Status represented by color chips, dots, and compact uppercase labels
- Critical/high use red/tertiary accents
- Active/success use green accents

### 6.4 Data Display

- Metrics displayed as bold numeric blocks with small trend indicators
- Progress tracks are thin and minimal
- Tables and list rows use hover states instead of dense borders

### 6.5 Chart Styling

- Charts are simplified and token-aligned
- Blue is the dominant quantitative color
- Supporting series use neutral gray, red, and tertiary tones

## 7. Motion and Interaction

Motion is restrained and purposeful:

- Hover elevation or slight translation on cards
- Button scale changes around 1.02 to 1.05
- Opacity reveal for row actions
- Pulse used only for urgent indicators (critical)

Interactions should feel responsive but never playful.

## 8. Spacing and Density

- Generous whitespace is part of the visual identity
- Sections commonly use 24 to 32px internal padding
- Vertical rhythm is consistent with moderate to large gaps
- Dense data areas remain readable via typography and tonal grouping

## 9. Iconography and Imagery

- Material Symbols Outlined as the primary icon set
- Icons are mostly outline style and semantically direct
- Avatar circles are used heavily for assignee/team context

## 10. Accessibility and Contrast Notes

The style relies on low-contrast tonal surfaces, so strong text contrast is important:

- Primary reading text should stay on on-surface
- Metadata should avoid becoming too faint against light surfaces
- Hover and focus states should remain visibly distinct

## 11. Implementation Summary

To reproduce this design style in frontend code:

- Use a consistent token-based surface stack
- Preserve the blue gradient CTA treatment
- Keep Inter as the single type family
- Prioritize spacing and hierarchy over borders
- Use subtle motion and minimal shadow
- Treat cards and side navigation as the core composition units

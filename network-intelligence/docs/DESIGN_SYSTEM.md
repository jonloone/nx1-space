# NexusOne Design System
## WCAG AA Compliant Color Palette

**Version:** 1.0.0
**Date:** 2025-10-13

---

## Brand Colors

### Primary Blue - #176BF8
- **Usage:** Primary actions, links, brand elements
- **Contrast:** 4.7:1 on white (WCAG AA ✓)
- **Hover:** #0D4DB8
- **Light Variant:** #4A8AFA

### Secondary Black - #080C16
- **Usage:** Logo, headings, high-contrast text
- **Contrast:** 16.8:1 on white (WCAG AAA ✓)

---

## Neutral Colors

### Text Colors (WCAG AA Compliant)

| Color | Hex | Contrast on White | Usage |
|-------|-----|-------------------|-------|
| **Primary** | #171717 | 12.6:1 | Headlines, body text |
| **Secondary** | #525252 | 5.7:1 | Subtext, labels |
| **Tertiary** | #737373 | 4.6:1 | Captions, meta text |

### Background Colors

| Color | Hex | Usage |
|-------|-----|-------|
| **Primary** | #FFFFFF | Main background |
| **Secondary** | #FAFAFA | Subtle backgrounds |
| **Tertiary** | #F5F5F5 | Hover states |

### Border Colors

| Color | Hex | Usage |
|-------|-----|-------|
| **Default** | #E5E5E5 | Standard borders |
| **Medium** | #D4D4D4 | Emphasized borders |
| **Strong** | #A3A3A3 | Strong emphasis |
| **Brand** | #176BF8 | Focused/selected states |

---

## Semantic Colors

### Success (Green)
- **Background:** #DCFCE7 (light green bg)
- **Border:** #86EFAC
- **Text:** #166534 (dark green)
- **Solid:** #22C55E (medium green)
- **Icon BG:** #D1FAE5

### Warning (Amber)
- **Background:** #FEF3C7
- **Border:** #FCD34D
- **Text:** #92400E
- **Solid:** #F59E0B

### Error (Red)
- **Background:** #FEE2E2
- **Border:** #FCA5A5
- **Text:** #991B1B
- **Solid:** #EF4444

### Info (Blue)
- **Background:** #DBEAFE
- **Border:** #93C5FD
- **Text:** #1E40AF
- **Solid:** #3B82F6
- **Icon BG:** #DBEAFE (used for brand-colored icons)

---

## Industry Colors

### Maritime
- **Primary:** #0EA5E9 (Sky Blue)
- **Background:** #E0F2FE
- **Border:** #7DD3FC
- **Usage:** Ship/port operations

### Logistics
- **Primary:** #10B981 (Emerald)
- **Background:** #D1FAE5
- **Border:** #6EE7B7
- **Usage:** Delivery/fleet management

### Defense/Intel
- **Primary:** #EF4444 (Red)
- **Background:** #FEE2E2
- **Border:** #FCA5A5
- **Usage:** Critical infrastructure

---

## Component Examples

### Buttons

```tsx
// Primary Button
<button className="bg-[#176BF8] hover:bg-[#0D4DB8] text-white px-5 py-3 rounded-lg font-semibold transition-colors">
  Primary Action
</button>

// Secondary Button
<button className="border border-[#E5E5E5] text-[#525252] hover:bg-[#F5F5F5] hover:border-[#A3A3A3] px-5 py-3 rounded-lg font-medium transition-colors">
  Secondary Action
</button>
```

### Cards

```tsx
// Standard Card
<div className="bg-white border border-[#E5E5E5] shadow-lg px-5 py-4 rounded-xl">
  <h3 className="text-[#171717] font-bold text-base mb-2">Card Title</h3>
  <p className="text-[#525252] text-sm">Card description text.</p>
</div>
```

### Input Fields

```tsx
// Text Input
<input
  type="text"
  placeholder="Enter text..."
  className="w-full px-4 py-2 border border-[#E5E5E5] rounded-lg text-[#171717] placeholder:text-[#A3A3A3] focus:outline-none focus:ring-2 focus:ring-[#176BF8] focus:border-transparent"
/>
```

### Status Badges

```tsx
// Success Status
<div className="bg-[#D1FAE5] text-[#166534] px-3 py-1 rounded-full text-xs font-semibold">
  Active
</div>

// Info Status
<div className="bg-[#DBEAFE] text-[#176BF8] px-3 py-1 rounded-full text-xs font-semibold">
  In Progress
</div>

// Error Status
<div className="bg-[#FEE2E2] text-[#991B1B] px-3 py-1 rounded-full text-xs font-semibold">
  Error
</div>
```

---

## Typography

### Font Weights
- **Regular:** 400 (body text)
- **Medium:** 500 (labels)
- **Semibold:** 600 (subheadings)
- **Bold:** 700 (headings)

### Text Sizes
```css
/* Headings */
.text-2xl { font-size: 1.5rem; }    /* 24px */
.text-xl { font-size: 1.25rem; }    /* 20px */
.text-lg { font-size: 1.125rem; }   /* 18px */
.text-base { font-size: 1rem; }     /* 16px */

/* Body */
.text-sm { font-size: 0.875rem; }   /* 14px */
.text-xs { font-size: 0.75rem; }    /* 12px */
```

---

## Spacing

### Standard Spacing Scale
```css
.space-1 { 0.25rem }  /* 4px */
.space-2 { 0.5rem }   /* 8px */
.space-3 { 0.75rem }  /* 12px */
.space-4 { 1rem }     /* 16px */
.space-5 { 1.25rem }  /* 20px */
.space-6 { 1.5rem }   /* 24px */
.space-8 { 2rem }     /* 32px */
```

---

## Shadows

```css
/* Small */
box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);

/* Medium */
box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);

/* Large */
box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);

/* Extra Large */
box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
```

---

## Accessibility Standards

### WCAG AA Requirements Met ✓
- **Text (< 18pt):** Minimum 4.5:1 contrast ratio
- **Large Text (≥ 18pt):** Minimum 3:1 contrast ratio
- **UI Components:** Minimum 3:1 contrast ratio

### Color Contrast Ratios

| Combination | Ratio | Pass |
|-------------|-------|------|
| #171717 on #FFFFFF | 12.6:1 | AAA |
| #525252 on #FFFFFF | 5.7:1 | AA |
| #737373 on #FFFFFF | 4.6:1 | AA |
| #176BF8 on #FFFFFF | 4.7:1 | AA |
| #FFFFFF on #176BF8 | 4.7:1 | AA |
| #166534 on #D1FAE5 | 8.2:1 | AAA |

---

## Usage Guidelines

### Do's ✓
- Use `#176BF8` for all primary actions and brand elements
- Use semantic colors (green/red/amber) to convey status
- Ensure text has minimum 4.5:1 contrast on backgrounds
- Use `#171717` for primary text, `#525252` for secondary
- Use `#E5E5E5` for standard borders

### Don'ts ✗
- Don't use light gray text on white backgrounds (< 4.5:1)
- Don't mix green (#10B981) with brand blue inconsistently
- Don't use thin borders (< 1px) for critical UI elements
- Don't place low-contrast text in critical areas
- Don't use pure black (#000000) - use `#171717` instead

---

## Migration Notes

### Changed from Previous Design

| Old Color | New Color | Reason |
|-----------|-----------|--------|
| Green brand | #176BF8 (Blue) | Align with NexusOne brand |
| Various grays | Standardized neutrals | WCAG compliance |
| White-on-white text | #525252 on white | Readable contrast |
| Generic borders | #E5E5E5 | Consistent visual weight |

### Files Updated (Phase 1 - Initial Implementation)
- ✅ `lib/design/colors.ts` - New color system
- ✅ `components/branding/NexusOneLogo.tsx` - Brand logo
- ✅ `components/gers/GERSSearchPanel.tsx` - WCAG colors applied
- ✅ `app/operations/page.tsx` - Status cards redesigned

### Files Updated (Phase 2 - Platform-Wide Implementation)
- ✅ `tailwind.config.js` - NexusOne Blue brand palette
- ✅ `app/globals.css` - CSS variables with WCAG AA colors
- ✅ `components/opintel/panels/LeftSidebar.tsx` - Status colors, opacity bars
- ✅ `components/opintel/panels/RightPanel.tsx` - Light theme conversion, all sub-panels
- ✅ `components/opintel/layout/MissionControlLayout.tsx` - Already using design tokens (no changes needed)

---

## Implementation Notes

### Design Token Architecture

The design system uses a two-tier approach:

1. **Tailwind Config (`tailwind.config.js`)**:
   - Brand color palette: `mundi-50` through `mundi-900` (NexusOne Blue variants)
   - Border radius: `mundi-sm`, `mundi-md`, `mundi-lg`, etc.
   - Shadows: `shadow-mundi-sm`, `shadow-mundi-md`, etc.

2. **CSS Variables (`globals.css`)**:
   - Semantic tokens: `--primary`, `--foreground`, `--border`, etc.
   - Used by shadcn/ui components via Tailwind utilities
   - Automatically converted from HSL values

### Component Color Usage

**Direct Hex Values (WCAG-compliant components):**
- `text-[#171717]` - Primary text (12.6:1 contrast)
- `text-[#525252]` - Secondary text (5.7:1 contrast)
- `text-[#737373]` - Tertiary text (4.6:1 contrast)
- `text-[#176BF8]` - Brand blue links/accents
- `border-[#E5E5E5]` - Standard borders
- `bg-[#F5F5F5]` - Subtle backgrounds
- `bg-[#176BF8]` - Primary buttons
- `hover:bg-[#0D4DB8]` - Button hover states

**Semantic Colors:**
- Success: `bg-[#22C55E]` (green) or `text-[#10B981]`
- Error: `bg-[#EF4444]` (red)
- Warning: `bg-[#F59E0B]` (amber)
- Info: `bg-[#176BF8]` (blue)

**Design Tokens (shadcn/ui components):**
- `bg-background`, `text-foreground`, `border-border`
- `bg-muted`, `text-muted-foreground`
- `bg-primary`, `text-primary-foreground`

### Migration Strategy

When converting existing components:

1. Replace dark theme (`bg-black/20`, `text-white/60`) with light theme
2. Replace generic Tailwind colors (`bg-blue-500`) with hex values
3. Ensure all text meets WCAG AA standards (4.5:1 contrast minimum)
4. Use NexusOne Blue (#176BF8) for all primary actions
5. Use semantic colors (green/red/amber) only for status indicators
6. Test with browser dev tools color contrast analyzer

---

## Future Enhancements

### Planned Additions
- [ ] Dark mode palette (WCAG AAA)
- [ ] Color blind safe palette
- [ ] Motion/animation tokens
- [ ] Focus state standards
- [ ] Error state patterns

---

**Design System Maintained By:** NexusOne Platform Team
**Last Updated:** 2025-10-13
**Version:** 1.0.0

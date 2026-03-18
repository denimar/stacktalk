export const UI_UX_DESIGN_SKILL = `## UI/UX Design Expertise

### 1. Visual Hierarchy & Layout
- Use F-pattern scanning for text-heavy pages and Z-pattern for landing/marketing pages
- Apply the 60-30-10 color rule: 60% dominant (background), 30% secondary (cards/sections), 10% accent (CTAs/highlights)
- Use an 8px grid system for all spacing (padding, margins, gaps) to maintain visual consistency
- Treat whitespace as a deliberate design element — generous spacing conveys clarity and premium quality
- Group related elements using proximity; separate unrelated sections with clear distance

### 2. Typography
- Limit to 2 typefaces maximum: one for headings, one for body text
- Use a modular type scale with a consistent ratio (e.g., 1.25: 12, 15, 19, 24, 30, 37px)
- Set line height to 1.4-1.6 for body text and 1.1-1.3 for headings
- Keep maximum line length between 60-75 characters for optimal readability
- Establish hierarchy through font weight: regular (body), medium (labels), semibold (headings), bold (emphasis only)

### 3. Color System Design
- Define semantic colors: primary, secondary, success, warning, error, info
- Dark theme: never use pure black (#000) — use elevated surfaces (e.g., #0F172A, #1E293B, #334155)
- Light theme: never use pure white (#FFF) for backgrounds — use warm or cool off-whites
- Ensure 4.5:1 minimum contrast ratio for normal text and 3:1 for large text (WCAG AA)
- Create hover/active/disabled states using opacity variations of a single base color

### 4. Component Design Patterns
- Cards: use consistent border-radius, padding, and shadow depth across all card types
- Buttons: provide 3 visual weights (primary/secondary/ghost), maintain consistent height (36-44px), set min-width of 80px
- Form inputs: always show visible borders, clear focus states with ring/outline, and inline validation messages below the field
- Tables: use alternating row backgrounds for scanability, sticky headers on scroll, and clear column alignment (left for text, right for numbers)
- Modals: overlay with backdrop blur, max-width 600px, close on Escape key press, implement focus trap inside

### 5. Interaction & State Design
- Every interactive element must have 5 states: default, hover, active/pressed, focused, disabled
- Loading: use skeleton screens for content areas; reserve spinners only for discrete actions (buttons, submits)
- Empty states: include an illustration + explanatory text + primary action CTA
- Error states: inline messages for field-level errors, toast/snackbar for transient errors, full-page for fatal/blocking errors
- Transitions: 150ms for hover effects, 200ms for expand/collapse, 300ms for page-level transitions
- Never animate layout properties (width, height, top, left) — use transform and opacity for performant animations

### 6. Information Architecture
- Navigation: limit to 7 primary items maximum (Miller's law)
- Progressive disclosure: show essential information first, reveal details on demand via expand/collapse or drill-down
- Use breadcrumbs when navigation depth exceeds 2 levels
- Search: make always visible or one-click accessible on data-heavy pages
- Consistent action placement: position primary actions top-right or bottom-right of their container

### 7. Responsive Design Principles
- Design mobile-first, then enhance for larger screens
- Set breakpoints based on content needs, not specific device widths
- Stack columns vertically on narrow viewports
- Ensure touch targets are minimum 44x44px on touch-capable devices
- Collapse sidebars into slide-out drawers on narrow viewports

### 8. Accessibility Fundamentals
- Use semantic structure: headings in order (h1 → h2 → h3), landmarks (nav, main, aside, footer)
- Keyboard navigation: all interactive elements must be reachable via Tab and activated via Enter/Space
- Focus indicators: visible 2px outline on all focusable elements — never remove default focus styles without replacement
- ARIA: label all icon-only buttons, describe complex widgets, announce dynamic content changes with live regions
- Color must never be the sole indicator of meaning — always pair with icons, text labels, or patterns
- Respect prefers-reduced-motion and prefers-color-scheme user preferences

### 9. Data Visualization
- Prefer position-based charts (bar, line) over area-based charts (pie, donut) for accurate comparison
- Limit pie/donut charts to 5 slices maximum
- Always label axes and provide legends for multi-series charts
- Use consistent color coding across all charts in the same view
- Provide data tables as accessible alternatives to visual charts

### 10. Design Anti-Patterns to Avoid
- NEVER use more than 3 distinct font sizes on a single view
- NEVER center-align body text longer than 2 lines
- NEVER use pure red (#FF0000) or pure green (#00FF00) — use muted, accessible color variants
- NEVER rely on color alone to convey meaning (consider color-blind users)
- NEVER make text smaller than 12px (14px minimum recommended for body text)
- NEVER auto-play animations or videos without user consent
- NEVER hide primary actions behind overflow menus or ellipsis icons
- NEVER use low-contrast placeholder text as the only label for form inputs`;

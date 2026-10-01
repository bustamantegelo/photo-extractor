# Design System

## 1. Overview

This design system defines the visual language for a high-energy racing and obstacle-event application.
The visual direction is inspired by the Spartan Race aesthetic:

- Dark, rugged foundation
- Strong red action color
- High-contrast white typography
- Bold typography
- Industrial and athletic visual language
- Clear, functional interfaces

The system targets **WCAG 2.2 Level AA** accessibility.

> **Note:** The color palette is inspired by the visual style of obstacle-course racing and is not intended to reproduce or represent official Spartan Race branding.

---

## 2. Design Principles

- **Bold**: Use strong contrast, typography, and visual hierarchy.
- **Functional**: Every element should have a clear purpose.
- **Accessible**: Accessibility is required across the entire interface.
- **Athletic**: The visual language should feel energetic, competitive, and performance-focused.
- **Consistent**: Colors, spacing, typography, buttons, forms, and states should behave consistently.

---

## 3. Color System

### 3.1 Core Palette

| Token              | Color     | Usage                |
| :----------------- | :-------- | :------------------- |
| `color-black`      | `#0A0A0A` | Primary background   |
| `color-black-soft` | `#151515` | Secondary background |
| `color-dark`       | `#222222` | Cards and surfaces   |
| `color-gray`       | `#6B6B6B` | Secondary UI         |
| `color-gray-light` | `#B8B8B8` | Secondary text       |
| `color-white`      | `#FFFFFF` | Primary text         |
| `color-red`        | `#D71920` | Primary action       |
| `color-red-dark`   | `#A80F15` | Hover/pressed        |
| `color-red-light`  | `#FF3B40` | Highlight            |

### 3.2 CSS Variables

```css
:root {
  --color-black: #0a0a0a;
  --color-black-soft: #151515;
  --color-dark: #222222;

  --color-gray: #6b6b6b;
  --color-gray-light: #b8b8b8;

  --color-white: #ffffff;

  --color-red: #d71920;
  --color-red-dark: #a80f15;
  --color-red-light: #ff3b40;

  --color-success: #16834b;
  --color-warning: #9a6700;
  --color-error: #d71920;
  --color-info: #1677b8;

  --color-focus: #ffffff;
}
```

---

## 4. Accessibility Contrast

All UI colors must be tested against their background.

### Required WCAG 2.2 AA Contrast

| Content         | Minimum Ratio |
| :-------------- | :------------ |
| Normal text     | 4.5:1         |
| Large text      | 3:1           |
| UI components   | 3:1           |
| Focus indicator | 3:1           |

### Preferred Combinations

- Use **White text** + **Black background** for primary content.
- Use **White text** + **Red background** for primary action buttons only when the selected red passes the required contrast for the text and component.
- **Avoid** using light gray text on dark gray surfaces when the contrast is insufficient.

---

## 5. Color Usage

### Primary: Red

Use for:

- Primary actions
- CTA buttons
- Active states
- Important highlights
- Race/event indicators

**Example:**

```css
.primary-action {
  background: var(--color-red);
  color: var(--color-white);
}
```

### Background: Black

Use for:

- Application background
- Navigation
- Main layouts

### Surface: Dark Gray

Use for:

- Cards
- Panels
- Dialogs
- Forms
- Data containers

### Text: White

Use for:

- Headings
- Primary content
- Important labels

---

## 6. Typography

Typography should feel bold, athletic, and modern while remaining highly readable.

### Font

Recommended:

```css
font-family:
  Inter,
  system-ui,
  -apple-system,
  BlinkMacSystemFont,
  "Segoe UI",
  sans-serif;
```

Alternative display fonts may be used for large headings, provided readability and accessibility are maintained.

---

## 7. Type Scale

| Element         | Size | Weight |
| :-------------- | :--- | :----- |
| **Display**     | 48px | 800    |
| **H1**          | 36px | 800    |
| **H2**          | 28px | 700    |
| **H3**          | 22px | 700    |
| **Body**        | 16px | 400    |
| **Body Strong** | 16px | 600    |
| **Small**       | 14px | 400    |
| **Caption**     | 12px | 400    |

**Example:**

```css
h1 {
  font-size: 36px;
  font-weight: 800;
  line-height: 1.15;
}

body {
  font-size: 16px;
  line-height: 1.5;
}
```

---

## 8. Typography Style

Headings should use:

- Bold weight
- Tight line height
- Short and descriptive text
- Strong hierarchy

**Example:**

- `RACE RESULTS`
- `10K OBSTACLE RACE`
- `PHOTOGRAPHER MANAGEMENT`

_Avoid excessive uppercase text for paragraphs or instructions._

---

## 9. Spacing

Use a consistent spacing scale.

| Token      | Value |
| :--------- | :---- |
| `space-1`  | 4px   |
| `space-2`  | 8px   |
| `space-3`  | 12px  |
| `space-4`  | 16px  |
| `space-5`  | 20px  |
| `space-6`  | 24px  |
| `space-8`  | 32px  |
| `space-10` | 40px  |
| `space-12` | 48px  |
| `space-16` | 64px  |

```css
:root {
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 20px;
  --space-6: 24px;
  --space-8: 32px;
  --space-10: 40px;
  --space-12: 48px;
  --space-16: 64px;
}
```

---

## 10. Buttons

Buttons should have a bold, action-oriented appearance.

### Primary Button

```css
.button-primary {
  min-height: 44px;
  padding: 10px 20px;

  background: var(--color-red);
  color: var(--color-white);

  border: 0;
  border-radius: 4px;

  font-weight: 700;
}
```

_Example Label:_ `START EXTRACTION`

### Secondary Button

```css
.button-secondary {
  min-height: 44px;
  padding: 10px 20px;

  background: transparent;
  color: var(--color-white);

  border: 1px solid var(--color-gray-light);
  border-radius: 4px;

  font-weight: 600;
}
```

---

## 11. Button States

Every button must support:

- Default
- Hover
- Focus
- Active
- Disabled

```css
button:focus-visible {
  outline: 3px solid var(--color-focus);
  outline-offset: 3px;
}

button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
```

_Do not remove focus indicators._

---

## 12. Cards

Cards should use dark surfaces against the black application background.

```css
.card {
  background: var(--color-dark);

  border: 1px solid #3a3a3a;
  border-radius: 6px;

  padding: 24px;
}
```

Cards should have:

- Clear heading
- Clear content hierarchy
- Sufficient spacing
- Visible boundaries

---

## 13. Forms

Forms should use high-contrast dark surfaces.

```css
.input {
  width: 100%;
  min-height: 44px;

  background: var(--color-black-soft);
  color: var(--color-white);

  border: 1px solid var(--color-gray);
  border-radius: 4px;

  padding: 10px 12px;
}

.input:focus-visible {
  outline: 3px solid var(--color-focus);
  outline-offset: 2px;
  border-color: var(--color-white);
}
```

### Requirements

- Every input must have a visible label.
- Do not use placeholders as the only label.
- Required fields must be identified.
- Errors must be clearly associated with the input.
- Error messages must explain how to resolve the issue.

---

## 14. File / Folder Input

For applications that work with files and folders:

```text
SOURCE FOLDER
[ C:\Photos\Race-2026              ] [ Browse ]

DESTINATION FOLDER
[ C:\Photos\Processed              ] [ Browse ]
```

### Recommended Interaction:

1. Label
2. Input
3. Browse Button
4. Validation / Help Text

_Do not rely solely on icons for file/folder actions._

---

## 15. Navigation

Navigation should use the dark theme.

```text
┌─────────────────────────────────────────────┐
│ APP NAME                                    │
├─────────────────────────────────────────────┤
│                                             │
│  Dashboard                                  │
│  Events                                     │
│  Photos                                     │
│  Photographers                              │
│  Settings                                   │
│                                             │
└─────────────────────────────────────────────┘
```

Active navigation items should use red as an accent.

**Example:**

```css
.nav-item.active {
  color: var(--color-white);
  border-left: 4px solid var(--color-red);
}
```

_Do not use red as the only indication of the active state._

---

## 16. Status Colors

Status should use both color and text/icon.

| Status         | Meaning             |
| :------------- | :------------------ |
| 🟢 Success     | Operation completed |
| 🟡 Warning     | Attention required  |
| 🔴 Error       | Operation failed    |
| 🔵 Information | Informational       |

**Example:**

- `✓ EXTRACTION COMPLETE`
- `⚠ 12 PHOTOS NEED REVIEW`
- `✕ DESTINATION FOLDER NOT FOUND`

_Never communicate status using color alone._

---

## 17. Progress

Long-running operations should display progress.

**Example:**

```text
EXTRACTING PHOTOS

████████████████░░░░  80%

800 / 1,000 photos processed
```

Where possible, provide:

- Current progress
- Total items
- Current operation
- Cancel action

In workflow screens that combine setup and processing, keep the active progress indicator near the top of the page, immediately after the relevant folder or input details. Do not place progress after the full form or action area, where it can fall below the fold.

For long selectable people lists, use compact rows and a responsive grid to keep choices scannable without giving each option unnecessary vertical space. Preserve readable names, visible selection state, and comfortable pointer targets.

---

## 18. Focus

Focus must always be visible.

```css
:focus-visible {
  outline: 3px solid var(--color-white);
  outline-offset: 3px;
}
```

For elements where a white outline is not sufficiently visible, use a contrasting focus treatment.

_Never use:_

```css
*:focus {
  outline: none;
}
```

---

## 19. Icons

Icons should support text rather than replace it.

**Good:** `[ 📁 Browse Folder ]`

**Icon-only buttons:**

```html
<button aria-label="Browse source folder">📁</button>
```

**Decorative icons:**

```html
<span aria-hidden="true">📁</span>
```

---

## 20. Dialogs

Dialogs should use the dark theme.

```text
┌──────────────────────────────────────┐
│ SELECT PHOTOGRAPHER              ✕   │
├──────────────────────────────────────┤
│                                      │
│  [ AB - Angelo Bustamante ]          │
│  [ JS - John Smith ]                 │
│  [ MR - Maria Reyes ]                │
│                                      │
│              [ CANCEL ]              │
└──────────────────────────────────────┘
```

### Requirements:

- Accessible dialog name
- Keyboard accessible
- Visible close action
- Focus moves into dialog
- Escape closes when appropriate
- Focus returns to the triggering element

---

## 21. Photographer Selection

For photographer selection, show initials alongside the full name.

**Example:**

- `AB — Angelo Bustamante`
- `JS — John Smith`
- `MR — Maria Reyes`

_The initials should not be the only accessible name._

---

## 22. Tables

Use tables for structured data.

```html
<table>
  <thead>
    <tr>
      <th scope="col">Photographer</th>
      <th scope="col">Photos</th>
      <th scope="col">Status</th>
    </tr>
  </thead>
</table>
```

Use clear column headings and maintain sufficient contrast.

---

## 23. Images

Images must have meaningful alternative text when they communicate information.

```html
<img src="race-photo.jpg" alt="Runner crossing an obstacle during the race" />
```

**Decorative images:**

```html
<img src="texture.png" alt="" aria-hidden="true" />
```

_Avoid placing important information exclusively inside images._

---

## 24. Motion

Respect reduced-motion preferences.

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms;
    animation-iteration-count: 1;
    transition-duration: 0.01ms;
    scroll-behavior: auto;
  }
}
```

Avoid unnecessary:

- Flashing
- Rapid animations
- Excessive transitions
- Motion required to understand content

---

## 25. Responsive Behavior

The application should remain usable when resized.

### Requirements:

- Support different window sizes.
- Avoid unnecessary horizontal scrolling.
- Maintain readable text.
- Keep controls accessible.
- Maintain logical navigation.
- Support 200% zoom where applicable.

---

## 26. Accessibility Checklist

### Color

- [ ] Normal text meets 4.5:1 contrast.
- [ ] Large text meets 3:1 contrast.
- [ ] UI components have sufficient contrast.
- [ ] Focus indicators are visible.
- [ ] Color is not the only way to communicate information.

### Typography

- [ ] Body text is at least 16px.
- [ ] Text remains readable when zoomed.
- [ ] Heading hierarchy is logical.
- [ ] Line spacing is sufficient.

### Keyboard

- [ ] All functionality works with keyboard.
- [ ] Tab order is logical.
- [ ] Focus is visible.
- [ ] No keyboard traps exist.
- [ ] Escape works where appropriate.

### Forms

- [ ] Every input has a label.
- [ ] Required fields are identified.
- [ ] Errors are clearly communicated.
- [ ] Errors explain how to fix the problem.

### Components

- [ ] Buttons have accessible names.
- [ ] Icon-only buttons have labels.
- [ ] Dialogs manage focus correctly.
- [ ] Status messages are accessible.
- [ ] Images have appropriate alt text.

---

## 27. Accessibility Testing

The application should be tested using:

### Automated

- axe DevTools
- Lighthouse Accessibility
- Browser accessibility inspection

### Keyboard

Test the complete application using only:

- `Tab` / `Shift + Tab`
- `Enter`
- `Space`
- `Escape`
- Arrow Keys

### Screen Readers

Recommended:

- **NVDA** — Windows
- **VoiceOver** — macOS

_Automated testing should not replace manual accessibility testing._

---

## 28. Design Tokens

The core design tokens can be represented as:

```css
:root {
  /* Colors */
  --color-black: #0a0a0a;
  --color-black-soft: #151515;
  --color-dark: #222222;

  --color-white: #ffffff;
  --color-gray: #6b6b6b;
  --color-gray-light: #b8b8b8;

  --color-red: #d71920;
  --color-red-dark: #a80f15;
  --color-red-light: #ff3b40;

  /* Spacing */
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 20px;
  --space-6: 24px;
  --space-8: 32px;
  --space-10: 40px;
  --space-12: 48px;
  --space-16: 64px;

  /* Radius */
  --radius-sm: 4px;
  --radius-md: 6px;
  --radius-lg: 10px;

  /* Typography */
  --font-size-body: 16px;
  --font-size-small: 14px;
  --font-size-h3: 22px;
  --font-size-h2: 28px;
  --font-size-h1: 36px;
}
```

---

## 29. Visual Direction

The overall UI should communicate:

```text
DARK  •  BOLD  •  FAST  •  ATHLETIC  •  INDUSTRIAL  •  HIGH-CONTRAST  •  FUNCTIONAL
```

### Recommended Visual Composition:

```text
BLACK BACKGROUND
       +
DARK SURFACES
       +
WHITE TYPOGRAPHY
       +
RED ACTIONS
       +
BOLD HEADINGS
       +
SUBTLE INDUSTRIAL DETAILS
```

The design should feel like a professional race-event operations platform, rather than a generic dashboard.

---

## 30. WCAG Target

Target standard: **WCAG 2.2 — Level AA**

Accessibility requirements should be treated as part of the component definition and acceptance criteria for every new feature.

> _Accessibility is a core part of the design system, not an optional enhancement._

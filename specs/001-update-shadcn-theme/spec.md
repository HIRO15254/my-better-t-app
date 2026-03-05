# Feature Specification: Update shadcn/ui Theme

**Feature Branch**: `claude/update-shadcn-theme-dbUGr`
**Created**: 2026-03-05
**Status**: Draft
**Input**: User description: "現在のサンプルをshadcn/uiの他のテーマに変えたい - Style: Nova, Theme: Emerald, Icons: Tabler Icons"

## Overview

The project currently uses shadcn/ui with the `base-lyra` style, `neutral` monochrome theme (no accent color), and `lucide-react` icons. The goal is to transform the visual identity by:

1. **Theme Colors**: Switch to an **Emerald green** accent color theme using Tailwind's emerald palette in OKLCH format
2. **Icon Library**: Migrate from `lucide-react` to `@tabler/icons-react`
3. **Style**: Update from `base-lyra` to `base-nova` in components.json (note: registry support for nova-style components is pending; existing components will be adjusted manually for nova aesthetics)

### Current State

- **Style**: `base-lyra`
- **Base Color**: `neutral` (monochrome grays, OKLCH)
- **Icon Library**: `lucide-react`
- **CSS Variables**: OKLCH-based, Tailwind CSS v4
- **Components Using Icons**: `loader.tsx`, `mode-toggle.tsx`, `sonner.tsx`, `checkbox.tsx`, `dropdown-menu.tsx`, `todos.tsx`

### Target State

- **Style**: `base-nova`
- **Theme**: Emerald green accent (primary, chart, sidebar colors)
- **Base Color**: `neutral` (unchanged)
- **Icon Library**: `@tabler/icons-react`

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Emerald Green Theme Applied (Priority: P1)

A developer opens the application and sees an Emerald green-themed UI instead of the current neutral/monochrome design. Primary buttons, links, sidebar accents, and chart colors all use the emerald palette.

**Why this priority**: The theme color change is the most visually impactful change and the core of this feature request.

**Independent Test**: Can be fully tested by running `bun run dev` and visually confirming that primary UI elements (buttons, sidebar, accents) display emerald green colors in both light and dark modes.

**Acceptance Scenarios**:

1. **Given** the app is running in light mode, **When** viewing any page, **Then** primary buttons and accents use emerald green (approximately oklch(0.696 0.17 162.48))
2. **Given** the app is running in dark mode, **When** viewing any page, **Then** primary buttons and accents use a lighter emerald shade appropriate for dark backgrounds
3. **Given** the app has chart components, **When** viewing charts, **Then** chart colors use the emerald-based palette

---

### User Story 2 - Tabler Icons Displayed (Priority: P2)

All icons in the application use Tabler Icons instead of Lucide React icons, maintaining the same visual intent (e.g., sun/moon for theme toggle, loader spinner, trash icon, check icon, chevron).

**Why this priority**: Icon library migration is important for visual consistency with the desired design system but requires careful mapping of each icon.

**Independent Test**: Can be tested by inspecting all pages that show icons and confirming they render Tabler Icons (visually different from Lucide).

**Acceptance Scenarios**:

1. **Given** the mode toggle component renders, **When** the user views it, **Then** sun and moon icons are rendered from `@tabler/icons-react`
2. **Given** a loading state is active, **When** the loader appears, **Then** it uses a Tabler loader/spinner icon
3. **Given** the dropdown menu renders, **When** submenus or checkmarks appear, **Then** they use Tabler check and chevron icons

---

### User Story 3 - components.json Updated for Future Use (Priority: P3)

The `components.json` configuration reflects the new style (`base-nova`), icon library (`tabler`), and theme settings so future `shadcn add` commands install components with the correct configuration.

**Why this priority**: Configuration alignment ensures consistency for future development but has no immediate visual impact.

**Independent Test**: Can be tested by running `bunx shadcn@latest add` for a test component and verifying it uses tabler icons.

**Acceptance Scenarios**:

1. **Given** `components.json` is updated, **When** reading the file, **Then** `style` is `"base-nova"`, `iconLibrary` is `"tabler"`
2. **Given** the configuration is valid, **When** running `bunx shadcn@latest info`, **Then** no configuration errors are reported

---

### Edge Cases

- What happens if a Tabler icon name doesn't have a 1:1 mapping to the Lucide icon it replaces? Use the closest visual equivalent.
- How does the app handle the emerald theme with existing destructive (red) color? The destructive color remains unchanged (red).
- What about dark mode sidebar colors? They should use emerald-based variants.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST update all CSS custom properties in `apps/web/src/index.css` to use emerald green accent colors in OKLCH format for `:root` (light) and `.dark` sections
- **FR-002**: System MUST replace all `lucide-react` imports with equivalent `@tabler/icons-react` imports across all component files
- **FR-003**: System MUST install `@tabler/icons-react` package and remove `lucide-react` from dependencies
- **FR-004**: System MUST update `apps/web/components.json` to reflect `style: "base-nova"` and `iconLibrary: "tabler"`
- **FR-005**: System MUST maintain visual and functional parity — all existing UI interactions MUST continue to work identically
- **FR-006**: System MUST preserve the `neutral` base color (grayscale) — only accent/primary colors change to emerald
- **FR-007**: System MUST ensure both light and dark mode themes have appropriate emerald color contrast

### Icon Mapping

| Lucide Icon | Tabler Equivalent | Used In |
|---|---|---|
| `Loader2` | `IconLoader2` | `loader.tsx`, `todos.tsx` |
| `Trash2` | `IconTrash` | `todos.tsx` |
| `Moon` | `IconMoon` | `mode-toggle.tsx` |
| `Sun` | `IconSun` | `mode-toggle.tsx` |
| `CircleCheck` | `IconCircleCheck` | `sonner.tsx` |
| `TriangleAlert` | `IconAlertTriangle` | `sonner.tsx` |
| `Info` | `IconInfoCircle` | `sonner.tsx` |
| `LoaderCircle` | `IconLoader` | `sonner.tsx` |
| `CheckIcon` | `IconCheck` | `checkbox.tsx`, `dropdown-menu.tsx` |
| `ChevronRightIcon` | `IconChevronRight` | `dropdown-menu.tsx` |

### CSS Theme Variables (Emerald)

Light mode primary colors based on Tailwind emerald palette:
- `--primary`: emerald-900 `oklch(0.378 0.077 168.94)`
- `--primary-foreground`: emerald-50 `oklch(0.979 0.021 166.113)`
- `--ring`: emerald-500 `oklch(0.696 0.17 162.48)`
- `--chart-*`: emerald-300 through emerald-900

Dark mode primary colors:
- `--primary`: emerald-400 `oklch(0.765 0.177 163.223)`
- `--primary-foreground`: emerald-950 `oklch(0.262 0.051 172.552)`
- `--sidebar-primary`: emerald-500 `oklch(0.696 0.17 162.48)`

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: All primary/accent UI elements display emerald green in both light and dark modes
- **SC-002**: Zero `lucide-react` imports remain in the codebase after migration
- **SC-003**: `bun run check-types` passes with no type errors after icon migration
- **SC-004**: `bun run test` passes with all existing tests succeeding
- **SC-005**: Both light and dark mode are visually correct with sufficient color contrast

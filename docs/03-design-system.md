# 03 — Design system (black & white, iOS)

The look is **iOS-native, monochrome**. Think Settings/Reminders: white grouped cards on a light grey background, hairline separators, SF system font, generous spacing, large bold titles, frosted translucent bars. One restrained "sparkle" ✦ accent on AI-generated bits (cover letters). No colour beyond black/white/grey except a single muted red for destructive actions.

## Colour tokens
- `--bg` #F2F2F7 (grouped background)
- `--card` #FFFFFF
- `--label` #000000
- `--secondary` #8A8A8E
- `--tertiary` #C7C7CC
- `--separator` #D8D8DC (hairline, 0.5px)
- `--fill` #000000 (primary buttons, active states)
- `--fill2` #EAEAEC (secondary buttons)
- `--danger` #C0392B (delete only)

## Typography
- System font stack: `-apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif`.
- Large title 32px / 800 weight, letter-spacing -0.03em.
- Row title 16px / 600. Secondary 13px. Section headers 12px uppercase grey.
- Slight negative letter-spacing globally (-0.01em).

## Components
- **Grouped list**: white rounded card (radius 16px) on grey bg, rows separated by 0.5px lines; section header above in grey uppercase.
- **Verdict pill**: "Apply now" = solid black pill; "Prep" = black outline pill; "Backup" = light grey pill.
- **Buttons**: full-width, radius 14px. Primary = black fill/white text. Tinted = light grey. Line = white with 1.5px black border.
- **Bars**: top bar and tab bar are translucent with `backdrop-filter: blur(20px)` (liquid-glass feel) and a 0.5px bottom/top separator.
- **Segmented control**: iOS style, grey track, white selected thumb with subtle shadow.
- **Tab bar**: 3 tabs (Jobs / Today / Materials), black when active, grey otherwise; optional count badge.

## Motion
- Detail view slides in from the right (cubic-bezier(.32,.72,0,1), ~0.28s). Respect `prefers-reduced-motion`.
- A subtle one-pass shimmer on the "Generate letter" button only. Keep motion minimal elsewhere (extra animation reads as AI-generated).

## Accessibility
- Visible keyboard focus (2px black outline).
- Tap targets >= 44px. Honour reduced motion. Text remains selectable in the cover-letter view.

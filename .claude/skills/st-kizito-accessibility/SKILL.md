---
name: st-kizito-accessibility
description: Project (St. Kizito). Accessibility standards for the mobile app and web admin — screen-reader labels, touch-target sizing, color contrast, dynamic text scaling for prayer text, focus order, and reduced motion. Read before building or reviewing any UI. The audience skews older and devout; readable, scalable, high-contrast prayer text is a core requirement, not a nicety.
version: 1.0.0
---

# St. Kizito Accessibility

Many parishioners are older. Legibility and assistive-tech support are **product requirements**.

## Mobile (React Native)

- **Dynamic text scale:** all long-form liturgical text (readings, psalms, office, reflections) must scale
  with `useTheme().textScale` driven by `TextSizeControl`. Never hardcode reading font sizes — the inline
  `text-[18px]` psalm bug broke this (audit §2.4). Respect OS font-scale settings too.
- **Touch targets ≥ 44×44** (existing `TextSizeControl` uses 52×52 — good). Icon buttons need padding.
- **Labels:** every interactive/icon-only control needs `accessibilityLabel` + appropriate
  `accessibilityRole`; state via `accessibilityState` (selected/disabled). Decorative images
  `accessibilityElementsHidden`/`importantForAccessibility="no"`.
- **Focus & order:** screen-reader reading order must follow visual/liturgical order (antiphon → psalm →
  Glory Be, reading → ending). Group related text so VoiceOver/TalkBack reads a prayer coherently.
- **Contrast:** meet WCAG AA (4.5:1 body, 3:1 large). Verify liturgical colors as *accents*, not text
  color, against both light and dark surfaces (`st-kizito-design-system`). Sepia reading theme must also
  pass.
- **Motion:** honor reduced-motion; Reading Mode auto-hide and animations must degrade gracefully.
- **Forms:** inputs have labels + `helperText`; errors announced, not color-only. Keyboard-aware.

## Web admin (Next.js)

- shadcn/Radix primitives are accessible by default — **keep their semantics** (don't strip roles/labels).
  Icon-only buttons get `aria-label`; dialogs keep focus trap + labelled title.
- Keyboard operable: all actions reachable via Tab/Enter/Escape; visible focus rings.
- Tables: `<th scope>`, caption/summary; charts (`recharts`) need text alternatives (labels, a data
  table fallback for key figures). Contrast AA in light + dark.

## Review checklist (every screen)

- [ ] Text scales with `textScale` (mobile) / respects zoom (web)
- [ ] Touch targets ≥ 44×44; visible focus (web)
- [ ] All icon/interactive controls labelled; correct roles/states
- [ ] Reading order matches visual + liturgical order
- [ ] Contrast AA in light AND dark (and sepia on mobile)
- [ ] Errors conveyed by text, not color alone
- [ ] Reduced-motion respected

## Engineering rules

1. No unlabeled interactive element. 2. No reading text with a fixed size — always `textScale`.
3. AA contrast in every theme. 4. Never encode meaning by color alone. 5. Keep Radix a11y intact on web.

## References

- `src/components/ui/TextSizeControl.tsx`, `src/hooks/useTheme.ts`, `src/theme/*`
- `apps/web/components/ui/*` (Radix). Standards: `docs/ACCESSIBILITY-STANDARDS.md`.
- Related: `st-kizito-premium-ui`, `st-kizito-design-system`.

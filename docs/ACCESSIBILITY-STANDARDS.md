# Accessibility Standards — St. Kizito

Operational companion to skill `st-kizito-accessibility`. Audience skews older/devout — legibility and
assistive-tech support are product requirements.

## Baseline (both apps)

- **WCAG 2.1 AA** contrast: 4.5:1 body text, 3:1 large text/icons — verified in **light AND dark** (and
  sepia reading theme on mobile).
- **Never encode meaning by color alone** (status, liturgical season, errors → also text/icon).
- All interactive/icon-only controls are **labelled** with correct role and state.
- Errors are conveyed by text, announced to assistive tech — not color-only.
- **Reduced motion** respected; animations degrade gracefully.

## Mobile (React Native)

- **Dynamic text scale:** all long-form liturgical text scales with `useTheme().textScale`
  (`TextSizeControl`); also respect OS font-scale. No hardcoded reading font sizes.
- **Touch targets ≥ 44×44** (icon buttons padded; existing controls use 52×52).
- `accessibilityLabel` + `accessibilityRole` + `accessibilityState` on controls; decorative images hidden.
- Screen-reader order follows visual + **liturgical** order (antiphon → psalm → Glory Be; reading → ending).
  Group a prayer so it reads coherently.
- Forms: labelled inputs + helper text; keyboard-aware; announced validation.

## Web admin (Next.js)

- Keep shadcn/Radix a11y semantics intact (roles, focus trap, labelled dialog titles). Icon buttons get `aria-label`.
- Fully keyboard-operable (Tab/Enter/Escape); visible focus rings.
- Tables use `<th scope>` + caption; charts (`recharts`) provide text/data-table alternatives for key figures.

## Per-screen checklist

- [ ] Text scales (mobile `textScale` / web zoom) · [ ] Targets ≥ 44×44 / visible focus
- [ ] All controls labelled, correct roles/states · [ ] Reading order matches visual + liturgical order
- [ ] AA contrast in light + dark (+ sepia) · [ ] Errors are text, not color-only · [ ] Reduced motion respected

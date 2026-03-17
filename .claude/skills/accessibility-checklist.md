---
name: accessibility-checklist
description: Use when building or reviewing UI components to ensure WCAG AA compliance, proper touch targets, contrast ratios, screen reader support, and keyboard navigation
---

# Accessibility Checklist (WCAG 2.1 AA)

## Overview

Every UI component must meet WCAG 2.1 AA standards. Accessibility is not optional and must be considered from the start, not bolted on after the fact.

## Color Contrast

- **Normal text:** minimum 4.5:1 contrast ratio against background
- **Large text (18px+ bold or 24px+ regular):** minimum 3:1 contrast ratio
- **UI components and graphical objects:** minimum 3:1 contrast ratio against adjacent colors
- Never rely on color alone to convey information (use icons, patterns, or text alongside color)
- Test in both light and dark modes if applicable
- Validate with tools: Chrome DevTools, axe, or Contrast Checker

## Touch Targets

- Minimum touch target size: 44x44px (CSS pixels)
- Adequate spacing between targets to prevent accidental taps (minimum 8px gap)
- Inline links in text blocks are exempt but should still be easy to tap
- Icon-only buttons must meet touch target size even if the icon is smaller (use padding)

## Focus Management

- **Visible focus indicators:** all interactive elements must show a clear focus ring (minimum 2px, 3:1 contrast)
- **Logical tab order:** follows visual reading order (left-to-right, top-to-bottom for LTR languages)
- **Focus trapping in modals/dialogs:** tab must cycle within the modal, not escape behind it
- **Restore focus:** when a modal closes, return focus to the element that triggered it
- **Skip navigation:** provide a "Skip to main content" link for keyboard users
- Never use `outline: none` without providing an alternative visible focus style
- Use `:focus-visible` to show focus rings only for keyboard navigation

## Screen Reader Support

- **Semantic HTML first:** use `<button>`, `<nav>`, `<main>`, `<header>`, `<footer>`, `<section>`, `<article>` instead of generic `<div>` with roles
- **Heading hierarchy:** use `<h1>` through `<h6>` in logical order, never skip levels
- **ARIA labels:** use `aria-label` or `aria-labelledby` when visible text is insufficient
- **ARIA live regions:** use `aria-live="polite"` for non-urgent updates, `aria-live="assertive"` for critical alerts
- **Alt text:** all informational images must have descriptive `alt`; decorative images use `alt=""`
- **Hidden content:** use `aria-hidden="true"` for decorative elements, `sr-only` class for screen-reader-only text
- **Announce state changes:** dynamic content updates must be announced (loading states, error messages, success confirmations)
- Test with actual screen readers (VoiceOver, NVDA, or TalkBack)

## Keyboard Navigation

- All interactive elements must be reachable via Tab key
- Custom components must implement expected keyboard patterns:
  - Buttons: Enter and Space to activate
  - Links: Enter to follow
  - Dropdowns/menus: Arrow keys to navigate, Enter to select, Escape to close
  - Tabs: Arrow keys to switch, Tab to move out of tab group
  - Modals: Escape to close
- No keyboard traps: user must always be able to navigate away from any element
- Avoid `tabindex` values greater than 0 (disrupts natural tab order)
- Use `tabindex="-1"` for programmatically focusable but not tab-reachable elements
- Use `tabindex="0"` for custom interactive elements that should be in tab order

## Motion and Animation

- Respect `prefers-reduced-motion` media query: disable or reduce all non-essential animations
- No auto-playing animations or videos without explicit user action
- Provide pause, stop, or hide controls for any moving content
- Avoid flashing content (nothing flashing more than 3 times per second)
- Parallax scrolling and complex scroll-triggered animations must have reduced-motion alternatives

## Form Accessibility

- Every input must have a visible `<label>` element linked via `for`/`id` or wrapping
- Placeholder text is not a substitute for labels
- Required fields must be indicated visually and programmatically (`required` attribute, `aria-required="true"`)
- Error messages must be linked to their input via `aria-describedby`
- Error messages must be specific (not just "invalid input" but "Email must include @")
- Group related fields with `<fieldset>` and `<legend>`
- Autocomplete attributes for common fields (name, email, address, phone)
- Submit buttons must have clear labels ("Create Account" not just "Submit")

## Responsive Text

- Text must be resizable up to 200% without loss of content or functionality
- Use relative units (`rem`, `em`) not fixed `px` for font sizes
- Ensure text does not overflow containers when resized
- Maintain readability at all zoom levels
- Line length should not exceed 80 characters for optimal readability
- Line height minimum 1.5x font size for body text

## Testing Checklist

```
[ ] Run automated accessibility audit (axe, Lighthouse)
[ ] Tab through entire page — all elements reachable, order logical
[ ] Test with screen reader — all content and states announced
[ ] Check color contrast on all text and UI elements
[ ] Verify touch targets on mobile
[ ] Test with 200% browser zoom
[ ] Test with prefers-reduced-motion enabled
[ ] Verify all forms with keyboard only
[ ] Check focus management in modals and dynamic content
[ ] Validate heading hierarchy
```

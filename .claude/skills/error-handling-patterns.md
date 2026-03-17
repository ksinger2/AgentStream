---
name: error-handling-patterns
description: Use when implementing error states, loading states, retry logic, offline handling, or user-facing error messages in consumer applications
---

# Error Handling Patterns

## Overview

Errors are inevitable. How we handle them defines the user experience. Every error state must be designed, not left to chance. Users should always understand what happened, whether they can fix it, and what to do next.

## User-Friendly Error Messages

- Never expose stack traces, error codes, or technical details to users
- Messages must answer three questions: What happened? Why? What can I do?
- Use plain language, not jargon ("We couldn't save your changes" not "500 Internal Server Error")
- Be specific when possible ("Your password must be at least 8 characters" not "Invalid input")
- Avoid blaming the user ("That email address isn't registered" not "You entered the wrong email")
- Maintain brand voice even in error states

## Error State Hierarchy

Errors should be handled at the most specific level possible:

1. **Field-level:** inline validation on individual inputs (show immediately on blur or after first submission attempt)
2. **Form-level:** summary of errors at the top of a form, with links to each problematic field
3. **Page-level:** full-page error state when the primary content cannot load (with retry action)
4. **App-level:** global error boundary catching unrecoverable errors (with recovery path)

Always prefer the most granular level. A single invalid field should not trigger a page-level error.

## Loading States

- **Skeleton screens over spinners:** skeleton screens reduce perceived load time and prevent layout shift
- **Spinners for actions:** use spinners for discrete actions like button clicks or form submissions
- **Progress indicators for long operations:** show determinate progress when duration is known, indeterminate when unknown
- **Disable trigger elements:** prevent duplicate submissions by disabling buttons and showing loading state
- **Set timeouts:** if loading exceeds a threshold (e.g., 10s), show a message ("This is taking longer than expected") with option to cancel or retry
- **Preserve context:** never clear a form or page while loading; show loading overlay instead

## Retry Logic

- **Exponential backoff:** wait 1s, 2s, 4s, 8s between retries (with jitter to prevent thundering herd)
- **Maximum retries:** cap at 3-5 attempts, then show user-facing error with manual retry option
- **Idempotency:** ensure retried operations are safe to repeat (use idempotency keys for mutations)
- **User-initiated retry:** always provide a visible "Try Again" button after automated retries fail
- **Selective retry:** only retry on transient errors (network, 5xx); do not retry on 4xx client errors
- **Retry state feedback:** show users that a retry is in progress ("Reconnecting... attempt 2 of 3")

## Offline Handling

- **Detect offline status:** listen to `navigator.onLine` and `online`/`offline` events
- **Inform users immediately:** show a persistent but non-blocking banner when offline
- **Queue write operations:** store pending mutations locally and sync when connectivity returns
- **Read from cache:** serve cached content when offline, indicate staleness if needed
- **Sync on reconnect:** automatically replay queued actions, resolve conflicts, notify user of results
- **Degrade gracefully:** disable features that require connectivity rather than showing errors
- **Test offline scenarios:** airplane mode, slow connections, intermittent connectivity

## Empty States

- Distinguish between "no data yet" (first use) and "no results" (filter/search returned nothing)
- **First use:** welcome message, explain value, provide clear CTA to get started
- **No results:** suggest broadening search, show related content, or provide a reset action
- **Error empty:** explain the failure, provide retry, link to help
- Include illustrations or icons to make empty states feel intentional, not broken
- Never show a completely blank screen

## Toast/Notification Patterns

- **Success messages:** auto-dismiss after 3-5 seconds, non-blocking
- **Error messages:** persist until user dismisses, include action button when applicable
- **Warning messages:** persist, allow dismissal, include link to details
- **Info messages:** auto-dismiss after 5-8 seconds
- Stack multiple toasts vertically, limit to 3 visible at once
- Position consistently (bottom-center for mobile, top-right for desktop)
- Include a dismiss button on all persistent notifications
- Toasts must be announced to screen readers via `aria-live` regions

## Error Boundaries

- Wrap major UI sections in error boundaries to prevent full-app crashes
- Show a fallback UI that matches the app design (not a white screen)
- Include a "Refresh" or "Go Home" action in the fallback
- Log caught errors to monitoring service (Sentry, DataDog, etc.)
- Error boundaries should catch rendering errors only; use try/catch for event handlers and async code
- Place boundaries at route level, feature level, and widget level
- Reset error boundary state on navigation

## API Error Handling

Map server responses to user-appropriate messages:

| Status Code | User Message | Action |
|-------------|-------------|--------|
| 400 | Specific validation message from API | Highlight invalid fields |
| 401 | "Please sign in again" | Redirect to login |
| 403 | "You don't have permission" | Link to request access or go back |
| 404 | "This page/item doesn't exist" | Suggest alternatives or go home |
| 408/timeout | "Request timed out" | Auto-retry then manual retry |
| 409 | "This was updated by someone else" | Show diff or force refresh |
| 429 | "Too many requests" | Auto-retry with backoff |
| 500 | "Something went wrong on our end" | Retry button, link to status page |
| 503 | "Service temporarily unavailable" | Auto-retry, show status page link |
| Network error | "Check your connection" | Show offline banner |

- Centralize API error handling in a shared interceptor or wrapper
- Always handle the `finally` block (reset loading states even on error)
- Set reasonable request timeouts (10-30s depending on operation)

## Optimistic Updates

- Update the UI immediately before server confirmation for common actions (likes, saves, toggles)
- Store the previous state for rollback
- On failure: revert UI to previous state, show a brief error toast
- Never use optimistic updates for destructive actions (delete, payment, send)
- Track pending optimistic updates and reconcile with server responses
- Show subtle indicators for unconfirmed optimistic updates when appropriate

---
name: performance-checklist
description: Use when optimizing app performance, reviewing bundle size, implementing lazy loading, image optimization, or caching strategies
---

# Performance Checklist

## Overview

Performance is a feature. Slow apps lose users. Every feature must be built with performance in mind, and every release should be measured against performance budgets. Optimize based on measurements, not assumptions.

## Bundle Size

### Targets
- Initial JavaScript bundle: under 200KB (compressed)
- Per-route chunks: under 50KB each
- Total page weight: under 1MB for initial load

### Optimization
- **Tree-shake unused code:** ensure bundler is configured for tree-shaking, avoid side-effect-ful imports
- **Code split by route:** each route should load only its own code, never the entire app
- **Dynamic imports for heavy libraries:** load charting, rich text editors, and PDF generators on demand
  ```
  const Chart = lazy(() => import('./Chart'))
  ```
- **Analyze regularly:** run bundle analyzer (webpack-bundle-analyzer, source-map-explorer) on every major change
- **Audit dependencies:** check bundle cost before adding new packages (bundlephobia.com)
- **Remove unused dependencies:** audit `package.json` regularly, remove packages not imported anywhere
- **Avoid duplicate packages:** check for multiple versions of the same library in the bundle

## Images and Media

### Formats
- Use next-gen formats: WebP for photos, AVIF where supported, SVG for icons and illustrations
- Provide fallbacks for older browsers using `<picture>` element
- Compress all images — aim for quality 75-85% for photos

### Responsive Images
- Use `srcset` and `sizes` to serve appropriate image dimensions per viewport
- Never serve a 2000px image to a 400px container
- Generate multiple sizes at build time or via image CDN

### Loading
- Lazy load all images below the fold with `loading="lazy"`
- Eager load hero images and above-the-fold content
- Set explicit `width` and `height` attributes to prevent Cumulative Layout Shift
- Use blur-up or dominant-color placeholders for lazy-loaded images

### Delivery
- Serve static assets through a CDN
- Enable Brotli or gzip compression for all text-based assets
- Set long cache headers for hashed/fingerprinted assets

## Caching

### HTTP Caching
- **Hashed static assets:** `Cache-Control: public, max-age=31536000, immutable`
- **HTML documents:** `Cache-Control: no-cache` (always revalidate)
- **API responses:** set appropriate `Cache-Control` based on data freshness needs
- Use `ETag` and `Last-Modified` headers for conditional requests

### Application-Level Caching
- **Service worker:** cache-first for static assets, network-first for API data
- **Stale-while-revalidate:** serve cached API responses immediately, refresh in background
- **Client-side cache:** normalize and cache API responses to prevent redundant fetches
- **Memoize expensive computations:** cache results of heavy calculations, invalidate on input change

### Cache Invalidation
- Version cache keys when data shape changes
- Provide manual cache-bust mechanism for debugging
- Clear related caches on write operations
- Set reasonable TTLs — stale data is worse than slow data for critical operations

## Rendering Performance

### Avoid Layout Thrashing
- Batch DOM reads and writes separately
- Use `requestAnimationFrame` for visual updates
- Avoid reading layout properties (offsetHeight, getBoundingClientRect) in loops

### Virtualize Long Lists
- Use windowing/virtualization for lists over 100 items (react-window, react-virtuoso, or equivalent)
- Only render items visible in the viewport plus a small buffer
- Recycle DOM nodes when scrolling

### Event Handling
- **Debounce** search inputs and resize handlers (150-300ms)
- **Throttle** scroll handlers and mousemove events (16ms for 60fps)
- Use passive event listeners for scroll and touch events
- Remove event listeners on component unmount

### CSS Performance
- Use CSS `contain` property to isolate layout, paint, and style recalculations
- Prefer `transform` and `opacity` for animations (GPU-composited, no layout/paint)
- Avoid animating layout properties (width, height, top, left, margin, padding)
- Minimize use of expensive selectors (`:nth-child`, `*`, deep nesting)

### React-Specific (if applicable)
- Use `React.memo` only where profiling shows unnecessary re-renders
- Use `useMemo` and `useCallback` for expensive computations and stable references passed to children
- Avoid creating new objects/arrays in render (move to state, refs, or memoize)
- Use React DevTools Profiler to identify slow components before optimizing
- Prefer component composition over deep prop drilling to reduce re-render scope

## Core Web Vitals Targets

### Largest Contentful Paint (LCP) < 2.5s
- Preload the LCP resource (hero image, main heading font)
- Minimize server response time (TTFB < 800ms)
- Remove render-blocking resources (defer non-critical CSS/JS)
- Ensure LCP element is in the initial HTML, not injected by JavaScript

### First Input Delay (FID) / Interaction to Next Paint (INP) < 200ms
- Break long tasks into smaller chunks (< 50ms per task)
- Use `requestIdleCallback` for non-urgent work
- Defer third-party scripts that are not needed for interactivity
- Keep main thread free during and after page load

### Cumulative Layout Shift (CLS) < 0.1
- Set explicit dimensions on images, videos, embeds, and ads
- Reserve space for dynamically loaded content
- Never insert content above existing content (except in response to user action)
- Use `font-display: optional` or `font-display: swap` with size-adjusted fallback fonts

## Monitoring

### Continuous Measurement
- **Real User Monitoring (RUM):** collect Core Web Vitals from real users (web-vitals library, analytics)
- **Lighthouse CI:** run Lighthouse in CI pipeline on every PR, fail on regressions
- **Performance budgets:** set automated alerts when bundle size or load time exceeds thresholds
- **Synthetic monitoring:** run scheduled tests from multiple regions to catch geographic issues

### Performance Review Cadence
```
[ ] Check Core Web Vitals weekly in analytics
[ ] Run bundle analysis on every major feature addition
[ ] Profile rendering performance for new interactive components
[ ] Audit third-party scripts quarterly (tag managers, analytics, chat widgets)
[ ] Review CDN cache hit rates monthly
[ ] Load test before major launches or expected traffic spikes
```

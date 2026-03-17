# New Page — Scaffold a Page/Route

Create a new page or route with all necessary files.

## Arguments
- **Page name/path**: $ARGUMENTS (or ask if not provided)

## Step 1: Determine Routing Conventions

Read `CLAUDE.md` and examine the existing codebase to determine:
- Routing framework (Next.js App Router, Pages Router, React Router, Vue Router, etc.)
- Page directory structure
- Layout system (shared layouts, nested layouts)
- Data fetching patterns (SSR, SSG, client-side, loaders)
- Meta/SEO patterns (head tags, metadata exports)

## Step 2: Create Page Files

Based on the project's routing conventions, create:

1. **Page file** — The main page component with proper data fetching pattern
2. **Layout file** — If the page needs a new layout or the framework requires one
3. **Loading state** — Loading UI component (loading.tsx for Next.js, Suspense boundary, etc.)
4. **Error state** — Error boundary or error page for this route
5. **Test file** — Basic page render test

## Step 3: Connect Navigation

If there's a navigation component, sidebar, or route config:
- Add the new page to navigation (if appropriate)
- Add route to any route configuration files
- Update any sitemap or route manifest

## Step 4: Verify

- Check the page renders at its expected URL
- Run the linter if configured
- Run tests if configured

## Step 5: Report

Tell the user what was created, the URL path, and any manual steps needed.

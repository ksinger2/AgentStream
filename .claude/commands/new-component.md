# New Component — Scaffold a UI Component

Create a new reusable UI component with all necessary files.

## Arguments
- **Component name**: $ARGUMENTS (or ask if not provided)

## Step 1: Determine Project Conventions

Read `CLAUDE.md` to determine:
- Component directory structure (e.g., `src/components/`)
- Styling approach (CSS modules, Tailwind, styled-components, etc.)
- Testing framework (Jest, Vitest, Playwright, etc.)
- Export patterns (barrel exports, named exports)
- TypeScript or JavaScript

## Step 2: Create Component Files

Based on the project's conventions, create:

1. **Component file** — The main component with proper typing, props interface, and default export
2. **Styles file** — If the project uses CSS modules or separate style files
3. **Test file** — Unit test with at minimum: renders without crashing, renders with props, handles key interactions
4. **Index/barrel file** — If the project uses barrel exports

Use the naming convention from the project (PascalCase, kebab-case, etc.).

## Step 3: Wire Up Exports

If the project has a components index file or barrel exports, add the new component to it.

## Step 4: Verify

- Ensure the component follows existing patterns in the codebase
- Run the linter if configured
- Run the test to verify it passes

## Step 5: Report

Tell the user what was created and where, with file paths.

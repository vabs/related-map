# Restore Search and Update Dependencies Implementation Plan

**Goal:** Restore related-idea searches and update all retained direct dependencies to current stable releases.

**Architecture:** Keep the static React application and D3 graph. Replace the unavailable CORS proxy with Google's direct callback endpoint. Replace Create React App with Vite and Jest with Vitest; retain GitHub Pages deployment under `/related-map/`.

**Constraints:** Preserve free-text search, autocomplete, bounded graph exploration, and graph dragging. Do not publish changes.

- [x] Reproduce unavailable proxy and Node 24 build crash; add search-to-graph and service-error regression tests.
- [x] Update package.json and lockfile; remove obsolete/unused packages, migrate entry point, MUI APIs and D3 drag handlers.
- [x] Run the full regression suite against the updated dependencies, including stale requests and timeouts.
- [x] Verify production build, dependency tree, audit and a live browser search. Document installation, operation and remaining service dependency.

Review focus: encoded query strings; stale responses; service failures/timeouts; graph reset and simulation cleanup; GitHub Pages asset paths.

Verification: nine tests pass; a fresh npm ci succeeds; production build succeeds; live Chromium search produced 17 nodes and 25 links with finite layout positions and no console errors; npm audit reports zero vulnerabilities and npm outdated reports no outdated direct dependencies. Build emits a bundle-size advisory (about 542 kB uncompressed).

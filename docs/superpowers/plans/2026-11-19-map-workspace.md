# Map Workspace Implementation Plan

**Goal:** Implement the approved light graph workspace, preserving direct suggestion searches and static hosting.
**Spec:** ../specs/2026-11-19-ui-direction.md
**Architecture:** App owns search and selection state; a bounded request loop builds an immutable graph. Chart owns D3 simulation, pan/zoom and rendering. CSS provides the responsive workspace, empty state and details panel.

- [x] Add failing interaction tests: explicit submission/examples, retry, selection/exploration and map controls. Retain transport, stale-response and graph-reset coverage.
- [x] Implement the search sidebar, loading/error/empty/results states and selectable ideas/details panel in src/App.jsx.
- [x] Implement responsive SVG, zoom/fit/pan, readable labels and accessible selection in src/Chart.jsx; keep input graph immutable and honor reduced motion.
- [x] Implement responsive layout and visual states in src/App.css and src/index.css.
- [x] Run tests/build; inspect desktop/mobile states and live search, graph controls and selection in Chromium. Review changes and fix concrete findings.

Constraints: no new service, accounts or publication; keep five-search/five-related-ideas bounds. Check stale requests, malformed input, no results, long terms, narrow viewports, keyboard operation and cleanup.

Verification: live production search returned 20 ideas and 25 connections; zoom and fit changed the viewport correctly; selected-node details worked; mobile 390px and desktop 1440px checks showed no horizontal overflow. Independent review found no major issues; its keyboard-focus and completion-announcement suggestions were implemented.

Final checks: 18 tests pass and production build succeeds. Desktop layout now keeps the header/search visible while the idea list scrolls independently; mobile stacks controls and details without horizontal overflow.

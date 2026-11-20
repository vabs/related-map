# Proposed UI direction: Related Map workspace

Status: approved for implementation by the user.

## Intent

Make the relationships the main content. Today two large blue header blocks occupy the first screen, while the graph sits below them. The fixed 960-pixel graph and 500-pixel search field also overflow small screens. People should be able to search, see results and understand the available interactions in one view.

## Approaches

- **Light graph workspace — recommended:** compact search sidebar, a large map, and an optional node detail panel. Makes repeated exploration easy while keeping the controls visible.
- **Minimal search page:** centered search with the map underneath. Smaller change, but loses space once results appear and offers less help while exploring.
- **Dark full-screen graph:** immersive map with floating controls. Attractive for exploration, but makes labels, focus states and mobile panels harder to keep clear.

The user approved implementation of the recommended light graph workspace.

## Recommended layout

A slim header carries a simple connected-node mark, “Related Map,” and a short help action. A roughly 300-pixel left column contains the search box, a clearly labeled Explore button, and a few example searches such as React, coffee and running. The remaining space is the map on a pale cool-gray dotted canvas. Use white surfaces, dark navy text and a restrained blue accent, with a system sans-serif font and readable 14–16px labels.

Before searching, the canvas explains “Start with an idea. See what connects.” A small illustrative node arrangement shows the concept without implying real search results. Clicking an example performs a real search.

During loading, retain the search controls and announce progress, for example “Exploring react · 2 of 5 searches.” A failure includes a concise explanation and Retry. No-results feedback suggests a broader query. Results show the root term prominently and report idea/connection counts.

The graph supports pan, zoom and Fit map. Root and related nodes have distinct styling, readable labels and visible keyboard focus. Selecting a node opens a details panel listing its connected ideas and an Explore this idea action; the same actions must be available as a keyboard-accessible text list.

On narrow screens, stack the search above a full-width graph. The details panel becomes an expandable section below the map. Avoid horizontal page scrolling and honor reduced-motion preferences.

## Implementation boundaries

Retain React, MUI and D3 and the static GitHub Pages deployment. Keep the current bounded search and Google suggestion source; do not invent saved projects, accounts or export controls. New controls need functional handlers and tests for search submission, examples, retries, selection and graph navigation. Check desktop and mobile layouts in a browser before delivery.

## Decisions still needed

Implement the light graph workspace. Branding, exact palette, spacing and small interaction details are delegated to the implementer.

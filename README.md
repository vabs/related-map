# Related Map

Find related ideas by exploring Google suggestions for “your term vs …”. Type a term and press Enter or Explore map, or choose an example topic. Pan and zoom the map, drag nodes, and select an idea to see its connections. Choose Explore this idea to start a new map from that term. Each search expands up to five terms, with up to five related ideas per term.

## Run locally

Use Node.js 22.12+ (22.x) or Node.js 24+. Then:

```sh
npm ci
npm start
```

Open http://127.0.0.1:5173/related-map/.

## Check and build

```sh
npm test
npm run build
npm run preview
```

The production site is generated in `build/`. Vite uses `/related-map/` as its base path for GitHub Pages. `npm run deploy` builds and publishes that directory using `gh-pages` when you are ready to deploy.

## Search integration

The app requests suggestions directly from Google's callback endpoint, avoiding the public CORS Anywhere proxy that now requires manual access. Queries are URL-encoded and requests time out after ten seconds. Failures appear below the search field with a Retry search action. Responses for an older query or selection are ignored.

This is an unofficial Google endpoint: availability and suggestion results can change, and network filtering or service rate limits can prevent results. No API key or backend is required.

## Toolchain

React 19, Material UI 9, D3 7, Vite 8 and Vitest 5. All retained direct dependencies were updated to current stable versions. Create React App, the unused Material UI icons/lab packages, and unused test helpers were removed. The lockfile pins the full dependency tree.

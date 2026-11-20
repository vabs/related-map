import React, { useEffect, useRef, useState } from "react";
import TextField from "@mui/material/TextField";
import Autocomplete from "@mui/material/Autocomplete";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import Chart from "./Chart";
import Icon from "./Icons";
import suggestions from "./suggestions";
import "./App.css";

const theme = createTheme({
  palette: { primary: { main: "#4055d8" } },
  typography: {
    fontFamily:
      'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  shape: { borderRadius: 10 },
});
const initialMap = {
  root: "",
  nodes: [],
  links: [],
  loading: false,
  error: "",
  completed: 0,
};
const examples = [
  { label: "React", note: "Tools & technology" },
  { label: "Coffee", note: "Everyday discoveries" },
  { label: "Running", note: "A different perspective" },
];

function EmptyMap() {
  return (
    <div className="empty-map">
      <div className="empty-illustration" aria-hidden="true">
        <svg viewBox="0 0 400 220">
          <path d="M200 109 91 49m109 60 116-53m-116 53 99 70m-99-70-93 71" />
          <circle className="orbit" cx="200" cy="109" r="63" />
          <circle className="orbit" cx="200" cy="109" r="99" />
          <circle className="satellite" cx="91" cy="49" r="7" />
          <circle className="satellite teal" cx="316" cy="56" r="7" />
          <circle className="satellite peach" cx="299" cy="179" r="7" />
          <circle className="satellite" cx="107" cy="180" r="7" />
          <rect
            className="idea-card"
            x="141"
            y="86"
            width="118"
            height="46"
            rx="12"
          />
          <circle className="idea-dot" cx="161" cy="109" r="5" />
          <text x="177" y="114">
            Your idea
          </text>
          <text className="orbit-label" x="46" y="31">
            a new angle
          </text>
          <text className="orbit-label" x="286" y="37">
            what if?
          </text>
          <text className="orbit-label" x="266" y="209">
            something related
          </text>
        </svg>
      </div>
      <span className="eyebrow">A LITTLE CURIOSITY GOES A LONG WAY</span>
      <h2>
        Start with an idea.
        <br />
        <span>See what connects.</span>
      </h2>
      <p>
        Discover alternatives, unexpected connections,
        <br className="desktop-break" /> and your next line of thought.
      </p>
      <div className="empty-hint">
        <span className="keycap">↵</span> Search an idea to create your
        first map
      </div>
    </div>
  );
}

export default function App() {
  const [query, setQuery] = useState("");
  const [options, setOptions] = useState([]);
  const [suggestionError, setSuggestionError] = useState("");
  const [map, setMap] = useState(initialMap);
  const [selected, setSelected] = useState(null);
  const [helpOpen, setHelpOpen] = useState(false);
  const debounce = useRef();
  const suggestionVersion = useRef(0);
  const mapVersion = useRef(0);
  const controllers = useRef(new Set());
  const activeSearch = useRef(null);
  const detailsHeading = useRef(null);
  const ideaButtons = useRef(new Map());

  useEffect(() => {
    if (selected)
      detailsHeading.current?.focus({
        preventScroll: window.matchMedia?.("(min-width: 1101px)").matches,
      });
  }, [selected]);

  function closeDetails() {
    ideaButtons.current.get(selected)?.focus({ preventScroll: true });
    setSelected(null);
  }

  useEffect(
    () => () => {
      mapVersion.current++;
      suggestionVersion.current++;
      clearTimeout(debounce.current);
      controllers.current.forEach((controller) => controller.abort());
    },
    [],
  );

  async function request(term) {
    const controller = new AbortController();
    controllers.current.add(controller);
    try {
      return await suggestions(term, { signal: controller.signal });
    } finally {
      controllers.current.delete(controller);
    }
  }

  function changeQuery(value) {
    setQuery(value);
    setOptions([]);
    setSuggestionError("");
    const version = ++suggestionVersion.current;
    clearTimeout(debounce.current);
    if (!value.trim()) {
      mapVersion.current++;
      activeSearch.current = null;
      setMap(initialMap);
      setSelected(null);
      return;
    }
    debounce.current = setTimeout(async () => {
      try {
        const data = await request(value);
        if (version === suggestionVersion.current) setOptions(data[1]);
      } catch (error) {
        if (version === suggestionVersion.current)
          setSuggestionError(error.message);
      }
    }, 400);
  }

  async function explore(value) {
    const root = value.trim().toLowerCase();
    if (
      !root ||
      (activeSearch.current?.root === root && activeSearch.current?.loading)
    )
      return;
    const version = ++mapVersion.current;
    activeSearch.current = { root, loading: true };
    suggestionVersion.current++;
    clearTimeout(debounce.current);
    setQuery(root);
    setOptions([]);
    setSuggestionError("");
    setSelected(null);
    setMap({ ...initialMap, root, loading: true });
    const nodes = new Map([[root, { id: root, group: 1 }]]);
    const queue = [root];
    const searched = new Set();
    const links = [];
    try {
      while (queue.length && searched.size < 5) {
        const term = queue.shift();
        const data = await request(`${term} vs `);
        if (version !== mapVersion.current) return;
        searched.add(term);
        const prefix = `${term} vs `;
        const related = [
          ...new Set(
            data[1]
              .map((text) => text.toLowerCase())
              .filter((text) => text.startsWith(prefix))
              .map((text) => text.slice(prefix.length).trim())
              .filter(
                (text) => text && text !== term && !text.includes(" vs "),
              ),
          ),
        ].slice(0, 5);
        related.forEach((id) => {
          if (!nodes.has(id)) {
            nodes.set(id, { id, group: nodes.get(term).group + 1 });
            queue.push(id);
          }
          links.push({ source: term, target: id, value: 1 });
        });
        setMap((previous) => ({ ...previous, completed: searched.size }));
      }
      if (version !== mapVersion.current) return;
      activeSearch.current = null;
      setMap({
        root,
        nodes: [...nodes.values()],
        links,
        completed: searched.size,
        loading: false,
        error: "",
      });
    } catch (error) {
      if (version !== mapVersion.current) return;
      activeSearch.current = null;
      setMap((previous) => ({
        ...previous,
        loading: false,
        error: error.message,
      }));
    }
  }

  const connections = selected
    ? [
        ...new Set(
          map.links.flatMap((link) =>
            link.source === selected
              ? [link.target]
              : link.target === selected
                ? [link.source]
                : [],
          ),
        ),
      ]
    : [];
  const hasMap = map.nodes.length > 0;
  const error = map.error || suggestionError;

  return (
    <ThemeProvider theme={theme}>
      <div className="workspace">
        <header className="app-topbar">
          <a className="brand" href="./" aria-label="Related Map home">
            <span className="brand-symbol">
              <Icon name="network" size={23} />
            </span>
            <span>
              related<span className="brand-light">map</span>
              <span className="brand-period">.</span>
            </span>
          </a>
          <span className="header-tagline">Follow your curiosity.</span>
          <button
            className={`help-button ${helpOpen ? "is-active" : ""}`}
            onClick={() => setHelpOpen(!helpOpen)}
            aria-expanded={helpOpen}
          >
            <Icon name="help" size={17} /> How it works
          </button>
        </header>
        {helpOpen && (
          <section className="help-banner" aria-label="How it works">
            <div>
              <strong>A search is just the beginning.</strong> Enter an idea to
              discover Google’s suggested alternatives. Select an idea to see
              its connections or start a new map. Drag nodes, pan the canvas,
              and use the zoom controls to look around.
            </div>
            <button
              className="icon-button"
              aria-label="Close help"
              onClick={() => setHelpOpen(false)}
            >
              <Icon name="close" />
            </button>
          </section>
        )}
        <div className="workspace-body">
          <aside className="search-sidebar" aria-label="Search and ideas">
            <section className="search-section">
              <span className="eyebrow">YOUR EXPLORATION STARTS HERE</span>
              <h1>
                One idea.
                <br /> New possibilities.
              </h1>
              <p className="sidebar-intro">
                See what people connect with the things you’re curious about.
              </p>
              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  explore(query);
                }}
              >
                <Autocomplete
                  freeSolo
                  disableClearable
                  options={options}
                  inputValue={query}
                  filterOptions={(items) => items}
                  onInputChange={(event, value, reason) => {
                    if (reason === "input" || reason === "clear")
                      changeQuery(value);
                  }}
                  onChange={(event, value) => {
                    if (value) explore(value);
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Search ideas"
                      placeholder="A tool, a topic, anything…"
                      size="small"
                      fullWidth
                      slotProps={{
                        ...params.slotProps,
                        htmlInput: {
                          ...params.slotProps.htmlInput,
                          type: "search",
                          maxLength: 150,
                        },
                      }}
                    />
                  )}
                />
                <button
                  className="primary-button explore-button"
                  type="submit"
                  disabled={!query.trim()}
                >
                  <Icon name={map.loading ? "network" : "search"} size={18} />{" "}
                  Explore map
                </button>
              </form>
              {error && (
                <div className="error-notice" role="alert">
                  <strong>We couldn’t load suggestions.</strong>
                  <p>{error}</p>
                  <button
                    className="text-button"
                    onClick={() => explore(map.error ? map.root : query)}
                  >
                    <Icon name="retry" size={16} /> Retry search
                  </button>
                </div>
              )}
            </section>
            {!hasMap && !map.loading && !map.error && (
              <section className="examples-section">
                <div className="section-label">A FEW PLACES TO START</div>
                <div className="example-topics">
                  {examples.map((example, index) => (
                    <button
                      className="example-topic"
                      key={example.label}
                      aria-label={`Try ${example.label}`}
                      onClick={() => explore(example.label)}
                    >
                      <span className={`example-icon example-${index}`}>
                        <Icon
                          name={
                            index === 0
                              ? "network"
                              : index === 1
                                ? "spark"
                                : "link"
                          }
                          size={19}
                        />
                      </span>
                      <span>
                        <strong>{example.label}</strong>
                        <small>{example.note}</small>
                      </span>
                      <Icon name="chevron" size={16} />
                    </button>
                  ))}
                </div>
              </section>
            )}
            {hasMap && (
              <section className="ideas-section">
                <div className="section-label">
                  IDEAS IN THIS MAP <span>{map.nodes.length}</span>
                </div>
                <div className="idea-list">
                  {map.nodes.map((node) => (
                    <button
                      key={node.id}
                      ref={(element) => {
                        if (element) ideaButtons.current.set(node.id, element);
                        else ideaButtons.current.delete(node.id);
                      }}
                      aria-controls="idea-details"
                      className={`idea-row ${selected === node.id ? "is-selected" : ""}`}
                      aria-label={`View connections for ${node.id}`}
                      aria-pressed={selected === node.id}
                      onClick={() => setSelected(node.id)}
                    >
                      <span
                        className={`idea-marker ${node.id === map.root ? "is-root" : ""}`}
                      />
                      <span>{node.id}</span>
                      {node.id === map.root && <small>START</small>}
                      <Icon name="chevron" size={14} />
                    </button>
                  ))}
                </div>
              </section>
            )}
            <div className="sidebar-footer">
              <Icon name="spark" size={17} />
              <p>
                Good ideas rarely happen
                <br />
                in a straight line.
              </p>
            </div>
          </aside>
          <main className="map-workspace">
            <div className="map-topbar">
              <div>
                <span className="section-label">
                  {hasMap ? "YOUR CONNECTION MAP" : "THE BIGGER PICTURE"}
                </span>
                <h2>{map.root || "A space for your next idea"}</h2>
              </div>
              {hasMap ? (
                <div className="map-counts">
                  <span>
                    <strong>{map.nodes.length}</strong> ideas
                  </span>
                  <span>
                    <strong>{map.links.length}</strong> connections
                  </span>
                </div>
              ) : (
                <span className="canvas-badge">
                  <span /> Open to possibilities
                </span>
              )}
            </div>
            <p
              className="sr-only"
              role="status"
              aria-label="Map updates"
              aria-live="polite"
            >
              {hasMap
                ? `${map.nodes.length} ideas and ${map.links.length} connection${map.links.length === 1 ? "" : "s"} ready. Select an idea to explore.`
                : ""}
            </p>
            <div className={`map-area ${selected ? "has-details" : ""}`}>
              {map.loading ? (
                <div className="loading-map" role="status">
                  <div className="loading-orbit">
                    <Icon name="network" size={30} />
                  </div>
                  <span className="eyebrow">CONNECTING THE DOTS</span>
                  <h2>Looking beyond “{map.root}”</h2>
                  <p>
                    Exploring {map.root} · {map.completed} of 5 searches
                  </p>
                  <div className="progress-track">
                    <span
                      style={{ width: `${Math.max(8, map.completed * 20)}%` }}
                    />
                  </div>
                </div>
              ) : hasMap ? (
                <>
                  <Chart
                    data={map}
                    root={map.root}
                    selectedId={selected}
                    onSelectNode={setSelected}
                  />
                  {map.links.length === 0 && (
                    <div className="no-results" role="status">
                      <strong>No related ideas found yet.</strong>
                      <span>Try a broader term or a different spelling.</span>
                    </div>
                  )}
                </>
              ) : map.error ? (
                <div className="empty-map error-map">
                  <span className="empty-error-icon">
                    <Icon name="retry" size={28} />
                  </span>
                  <h2>A small detour.</h2>
                  <p>
                    The suggestion service didn’t respond.
                    <br />
                    Your idea is still a good place to start.
                  </p>
                  <button
                    className="primary-button"
                    onClick={() => explore(map.root)}
                  >
                    Try again
                  </button>
                </div>
              ) : (
                <EmptyMap />
              )}
              {selected && hasMap && (
                <section
                  id="idea-details"
                  className="node-details"
                  aria-label="Selected idea details"
                >
                  <div className="details-heading">
                    <span className="section-label">A CLOSER LOOK</span>
                    <button
                      className="icon-button"
                      onClick={closeDetails}
                      aria-label="Close idea details"
                    >
                      <Icon name="close" size={17} />
                    </button>
                  </div>
                  <span className="details-node">
                    <Icon name="network" size={22} />
                  </span>
                  <h2 ref={detailsHeading} tabIndex={-1}>
                    {selected}
                  </h2>
                  <p>
                    {selected === map.root
                      ? "The idea that started this map."
                      : "One idea can open a new direction."}
                  </p>
                  <div className="details-connections">
                    <span className="section-label">
                      CONNECTED IDEAS · {connections.length}
                    </span>
                    {connections.map((id) => (
                      <button key={id} onClick={() => setSelected(id)}>
                        <span>{id}</span>
                        <Icon name="chevron" size={15} />
                      </button>
                    ))}
                  </div>
                  <button
                    className="primary-button"
                    onClick={() => explore(selected)}
                  >
                    <Icon name="spark" size={17} /> Explore this idea
                  </button>
                </section>
              )}
            </div>
            <footer className="map-footer">
              <span>
                <Icon name="link" size={15} /> Connections inspired by Google
                suggestions
              </span>
              <span>
                {hasMap
                  ? "Drag to rearrange · Scroll to zoom"
                  : "A new perspective is one search away"}
              </span>
            </footer>
          </main>
        </div>
      </div>
    </ThemeProvider>
  );
}

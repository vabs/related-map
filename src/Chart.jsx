import React, { useEffect, useRef, useState } from "react";
import {
  select,
  forceSimulation,
  forceLink,
  forceManyBody,
  forceCenter,
  forceCollide,
  drag,
  zoom,
  zoomIdentity,
} from "d3";
import Icon from "./Icons";

const COLORS = ["#4055d8", "#20978c", "#d28448", "#8e6dbb", "#4c8fae"];

export default function Chart({ data, root, selectedId, onSelectNode }) {
  const containerRef = useRef(null);
  const svgRef = useRef(null);
  const [dimensions, setDimensions] = useState({ width: 1000, height: 700 });
  const { width: WIDTH, height: HEIGHT } = dimensions;
  const zoomRef = useRef(null);
  const fitRef = useRef(null);
  const selectRef = useRef(onSelectNode);
  const [scale, setScale] = useState(1);
  selectRef.current = onSelectNode;

  useEffect(() => {
    if (!window.ResizeObserver) return;
    const measure = () => {
      const element = containerRef.current;
      const width = Math.max(300, element.clientWidth);
      const height = Math.max(400, element.clientHeight);
      setDimensions((previous) =>
        previous.width === width && previous.height === height
          ? previous
          : { width, height },
      );
    };
    const observer = new ResizeObserver(measure);
    observer.observe(containerRef.current);
    measure();
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const svg = select(svgRef.current);
    svg.selectAll("*").remove();
    const viewport = svg.append("g").attr("class", "graph-viewport");
    const nodes = data.nodes.map((node) => ({ ...node }));
    const links = data.links.map((link) => ({ ...link }));
    const reducedMotion = window.matchMedia?.(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const simulation = forceSimulation(nodes)
      .force(
        "link",
        forceLink(links)
          .id((node) => node.id)
          .distance(145),
      )
      .force("charge", forceManyBody().strength(-700))
      .force("center", forceCenter(WIDTH / 2, HEIGHT / 2))
      .force("collision", forceCollide().radius(54))
      .stop();
    simulation.tick(200);

    const link = viewport
      .append("g")
      .attr("class", "links")
      .selectAll("line")
      .data(links)
      .join("line");
    const node = viewport
      .append("g")
      .attr("class", "nodes")
      .selectAll("g")
      .data(nodes)
      .join("g")
      .attr("data-node", (item) => item.id)
      .attr("class", (item) =>
        item.id === root ? "map-node root-node" : "map-node",
      )
      .attr("role", "button")
      .attr("tabindex", 0)
      .attr("aria-controls", "idea-details")
      .attr("aria-label", (item) => `Select ${item.id} on map`)
      .on("click", (event, item) => selectRef.current?.(item.id))
      .on("keydown", (event, item) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          selectRef.current?.(item.id);
        }
      });
    node
      .append("circle")
      .attr("class", "node-halo")
      .attr("r", (item) => (item.id === root ? 24 : 18));
    node
      .append("circle")
      .attr("class", "node-dot")
      .attr("r", (item) => (item.id === root ? 10 : 6))
      .attr("fill", (item) => COLORS[(item.group - 1) % COLORS.length]);
    node
      .append("text")
      .attr("x", 0)
      .attr("y", (item) => (item.id === root ? 37 : 29))
      .attr("text-anchor", "middle")
      .text((item) => item.id);
    node.append("title").text((item) => `View connections for ${item.id}`);

    function ticked() {
      link
        .attr("x1", (item) => item.source.x)
        .attr("y1", (item) => item.source.y)
        .attr("x2", (item) => item.target.x)
        .attr("y2", (item) => item.target.y);
      node.attr("transform", (item) => `translate(${item.x},${item.y})`);
    }
    simulation.on("tick", ticked);
    ticked();
    node.call(
      drag()
        .on("start", (event, item) => {
          if (!event.active && !reducedMotion)
            simulation.alphaTarget(0.15).restart();
          item.fx = item.x;
          item.fy = item.y;
        })
        .on("drag", (event, item) => {
          item.fx = event.x;
          item.fy = event.y;
          if (reducedMotion) {
            item.x = event.x;
            item.y = event.y;
            ticked();
          }
        })
        .on("end", (event, item) => {
          if (!event.active) simulation.alphaTarget(0);
          item.fx = null;
          item.fy = null;
        }),
    );

    const zoomBehavior = zoom()
      .extent([
        [0, 0],
        [WIDTH, HEIGHT],
      ])
      .scaleExtent([0.25, 3])
      .on("zoom", (event) => {
        viewport.attr("transform", event.transform);
        node
          .select("text")
          .style(
            "font-size",
            (item) => `${(item.id === root ? 16 : 13) / event.transform.k}px`,
          );
        setScale(event.transform.k);
      });
    svg.call(zoomBehavior).on("dblclick.zoom", null);
    zoomRef.current = zoomBehavior;
    fitRef.current = () => {
      if (!nodes.length) return;
      const minX = Math.min(
        ...nodes.map((item) => item.x - Math.max(45, item.id.length * 4.5)),
      );
      const maxX = Math.max(
        ...nodes.map((item) => item.x + Math.max(45, item.id.length * 4.5)),
      );
      const minY = Math.min(...nodes.map((item) => item.y - 40));
      const maxY = Math.max(...nodes.map((item) => item.y + 55));
      const factor = Math.max(
        0.25,
        Math.min(
          1.2,
          (WIDTH - 90) / (maxX - minX),
          (HEIGHT - 160) / (maxY - minY),
        ),
      );
      svg.call(
        zoomBehavior.transform,
        zoomIdentity
          .translate(WIDTH / 2, HEIGHT / 2)
          .scale(factor)
          .translate(-(minX + maxX) / 2, -(minY + maxY) / 2),
      );
    };
    fitRef.current();
    return () => {
      simulation.stop();
      svg.on(".zoom", null);
      zoomRef.current = null;
      fitRef.current = null;
    };
  }, [data.nodes, data.links, root, WIDTH, HEIGHT]);

  useEffect(() => {
    const svg = select(svgRef.current);
    svg
      .selectAll(".map-node")
      .classed("is-selected", (item) => item.id === selectedId)
      .attr("aria-pressed", (item) =>
        item.id === selectedId ? "true" : "false",
      );
    svg
      .selectAll(".links line")
      .classed(
        "is-connected",
        (item) =>
          item.source.id === selectedId || item.target.id === selectedId,
      );
  }, [selectedId, data.nodes, data.links, WIDTH, HEIGHT]);

  const changeZoom = (factor) => {
    if (zoomRef.current)
      select(svgRef.current).call(zoomRef.current.scaleBy, factor);
  };
  return (
    <div ref={containerRef} className="chart-container">
      <svg
        ref={svgRef}
        className="graph"
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        aria-label={`Connection map for ${root}`}
        role="group"
      />
      <div className="map-legend">
        <span>
          <i className="legend-root" /> Starting idea
        </span>
        <span>
          <i /> Related idea
        </span>
      </div>
      <div className="map-controls" aria-label="Map navigation">
        <button
          className="icon-button"
          aria-label="Zoom out"
          onClick={() => changeZoom(1 / 1.25)}
        >
          <Icon name="minus" size={18} />
        </button>
        <output aria-label="Map zoom">{Math.round(scale * 100)}%</output>
        <button
          className="icon-button"
          aria-label="Zoom in"
          onClick={() => changeZoom(1.25)}
        >
          <Icon name="plus" size={18} />
        </button>
        <span className="control-divider" />
        <button
          className="fit-button"
          aria-label="Fit map"
          onClick={() => fitRef.current?.()}
        >
          <Icon name="fit" size={17} /> Fit
        </button>
      </div>
    </div>
  );
}

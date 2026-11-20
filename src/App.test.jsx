import { vi } from "vitest";
import React from "react";
import { act, fireEvent, render } from "@testing-library/react";
import App from "./App";

const scripts = () =>
  Array.from(
    document.querySelectorAll('script[src*="suggestqueries.google.com"]'),
  );
const respond = async (suggestions) => {
  const script = scripts()[0];
  expect(script).toBeDefined();
  const url = new URL(script.src);
  await act(async () => {
    window[url.searchParams.get("callback")]([
      url.searchParams.get("q"),
      suggestions,
    ]);
  });
};

beforeEach(() => vi.useFakeTimers());
afterEach(() => {
  vi.clearAllTimers();
  vi.useRealTimers();
});

test("loads suggestions directly and builds a graph from a selected term", async () => {
  const { getByRole, container } = render(<App />);
  const input = getByRole("combobox", { name: "Search ideas" });
  fireEvent.change(input, { target: { value: "react" } });
  act(() => vi.advanceTimersByTime(1000));
  await respond(["react"]);
  fireEvent.keyDown(input, { key: "Enter", code: "Enter" });
  act(() => vi.advanceTimersByTime(1000));
  await respond(["react vs vue", "react vs angular"]);
  await respond(["vue vs react"]);
  await respond(["angular vs react"]);
  expect(container.querySelectorAll(".nodes .node-dot")).toHaveLength(3);
  expect(container.querySelectorAll(".links line")).toHaveLength(4);
});

test("shows a recoverable error when the suggestion service fails", async () => {
  const { getByRole } = render(<App />);
  fireEvent.change(getByRole("combobox", { name: "Search ideas" }), {
    target: { value: "react" },
  });
  act(() => vi.advanceTimersByTime(1000));
  expect(scripts()).toHaveLength(1);
  await act(async () => {
    scripts()[0].dispatchEvent(new Event("error"));
  });
  expect(getByRole("alert")).toHaveTextContent(/try again/i);
  expect(scripts()).toHaveLength(0);
});

test("ignores suggestions from a previous query", async () => {
  const { getByRole, queryByText, getByText } = render(<App />);
  const input = getByRole("combobox", { name: "Search ideas" });
  fireEvent.change(input, { target: { value: "old" } });
  act(() => vi.advanceTimersByTime(1000));
  fireEvent.change(input, { target: { value: "new" } });
  act(() => vi.advanceTimersByTime(1000));
  const latest = new URL(scripts()[1].src);
  await act(async () => {
    window[latest.searchParams.get("callback")](["new", ["new suggestion"]]);
  });
  await respond(["old suggestion"]);
  expect(queryByText("old suggestion")).not.toBeInTheDocument();
  expect(getByText("new suggestion")).toBeInTheDocument();
});

test("reports a timed out request and removes its script", async () => {
  const { getByRole } = render(<App />);
  fireEvent.change(getByRole("combobox", { name: "Search ideas" }), {
    target: { value: "react" },
  });
  act(() => vi.advanceTimersByTime(1000));
  await act(async () => {
    vi.advanceTimersByTime(10000);
  });
  expect(getByRole("alert")).toHaveTextContent(/try again/i);
  expect(scripts()).toHaveLength(0);
});

test("clears the graph when the input is emptied", async () => {
  const { getByRole, container } = render(<App />);
  const input = getByRole("combobox", { name: "Search ideas" });
  fireEvent.change(input, { target: { value: "react" } });
  fireEvent.keyDown(input, { key: "Enter", code: "Enter" });
  act(() => vi.advanceTimersByTime(1000));
  await respond(["react vs vue"]);
  await respond([]);
  expect(container.querySelectorAll(".nodes .node-dot")).toHaveLength(2);
  fireEvent.change(input, { target: { value: "" } });
  act(() => vi.advanceTimersByTime(1000));
  expect(container.querySelectorAll(".nodes .node-dot")).toHaveLength(0);
});

test("does not add an old graph response to a new selection", async () => {
  const { getByRole, container } = render(<App />);
  const input = getByRole("combobox", { name: "Search ideas" });
  fireEvent.change(input, { target: { value: "react" } });
  fireEvent.keyDown(input, { key: "Enter", code: "Enter" });
  act(() => vi.advanceTimersByTime(1000));
  fireEvent.change(input, { target: { value: "vue" } });
  fireEvent.keyDown(input, { key: "Enter", code: "Enter" });
  act(() => vi.advanceTimersByTime(1000));
  await respond(["react vs angular"]);
  await respond([]);
  expect(container.querySelectorAll(".nodes .node-dot")).toHaveLength(1);
  expect(container.querySelector(".nodes text")).toHaveTextContent("vue");
});

test("preserves node groups when completing the graph", async () => {
  const { getByRole, container } = render(<App />);
  const input = getByRole("combobox", { name: "Search ideas" });
  fireEvent.change(input, { target: { value: "react" } });
  fireEvent.keyDown(input, { key: "Enter", code: "Enter" });
  act(() => vi.advanceTimersByTime(1000));
  await respond(["react vs vue"]);
  await respond([]);
  const circles = container.querySelectorAll(".nodes .node-dot");
  expect(circles[0].getAttribute("fill")).not.toBe(
    circles[1].getAttribute("fill"),
  );
});

test("starts a real search from an example topic", async () => {
  const { getByRole, container } = render(<App />);
  fireEvent.click(getByRole("button", { name: "Try React" }));
  expect(getByRole("combobox", { name: "Search ideas" })).toHaveValue("react");
  await respond(["react vs vue"]);
  await respond([]);
  expect(container.querySelectorAll(".nodes .node-dot")).toHaveLength(2);
  expect(
    getByRole("button", { name: "View connections for vue" }),
  ).toBeInTheDocument();
});

test("submits the search form and exposes details for a selected idea", async () => {
  const { getByRole, getByText } = render(<App />);
  fireEvent.change(getByRole("combobox", { name: "Search ideas" }), {
    target: { value: "react" },
  });
  fireEvent.click(getByRole("button", { name: "Explore map" }));
  await respond(["react vs vue"]);
  await respond([]);
  fireEvent.click(getByRole("button", { name: "View connections for vue" }));
  expect(getByRole("heading", { name: "vue" })).toHaveFocus();
  fireEvent.click(getByRole("button", { name: "Explore this idea" }));
  expect(getByRole("combobox", { name: "Search ideas" })).toHaveValue("vue");
  await respond([]);
  expect(getByText(/try a broader/i)).toBeInTheDocument();
});

test("retries a failed map search", async () => {
  const { getByRole, container } = render(<App />);
  fireEvent.click(getByRole("button", { name: "Try React" }));
  await act(async () => scripts()[0].dispatchEvent(new Event("error")));
  expect(getByRole("alert")).toHaveTextContent(/try again/i);
  fireEvent.click(getByRole("button", { name: "Retry search" }));
  await respond(["react vs vue"]);
  await respond([]);
  expect(container.querySelectorAll(".nodes .node-dot")).toHaveLength(2);
});

test("bounds graph expansion to five requests even when more ideas are discovered", async () => {
  const { getByRole, container } = render(<App />);
  fireEvent.click(getByRole("button", { name: "Try React" }));
  await respond([
    "react vs vue",
    "react vs angular",
    "react vs svelte",
    "react vs solid",
    "react vs preact",
  ]);
  await respond(["vue vs react"]);
  await respond(["angular vs react"]);
  await respond(["svelte vs react"]);
  await respond(["solid vs react"]);
  expect(scripts()).toHaveLength(0);
  expect(container.querySelectorAll(".node-dot")).toHaveLength(6);
  expect(container.querySelectorAll(".links line")).toHaveLength(9);
});

test("returns keyboard focus to the idea list when details are closed", async () => {
  const { getByRole } = render(<App />);
  fireEvent.click(getByRole("button", { name: "Try React" }));
  await respond(["react vs vue"]);
  await respond([]);
  const idea = getByRole("button", { name: "View connections for vue" });
  fireEvent.click(idea);
  expect(getByRole("heading", { name: "vue" })).toHaveFocus();
  fireEvent.click(getByRole("button", { name: "Close idea details" }));
  expect(idea).toHaveFocus();
});

test("announces completed map results", async () => {
  const { getByRole } = render(<App />);
  fireEvent.click(getByRole("button", { name: "Try React" }));
  await respond(["react vs vue"]);
  await respond([]);
  expect(getByRole("status", { name: "Map updates" })).toHaveTextContent(
    "2 ideas and 1 connection ready",
  );
});

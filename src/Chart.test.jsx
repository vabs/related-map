import React from "react";
import { fireEvent, render } from "@testing-library/react";
import { vi } from "vitest";
import Chart from "./Chart";

const data = {
  nodes: [
    { id: "react", group: 1 },
    { id: "vue", group: 2 },
  ],
  links: [{ source: "react", target: "vue", value: 1 }],
};

test("selects a node with the keyboard and keeps graph inputs immutable", () => {
  const select = vi.fn();
  const { getByRole } = render(
    <Chart data={data} root="react" onSelectNode={select} />,
  );
  fireEvent.keyDown(getByRole("button", { name: "Select vue on map" }), {
    key: "Enter",
  });
  expect(select).toHaveBeenCalledWith("vue");
  expect(data.nodes[0]).toEqual({ id: "react", group: 1 });
  expect(data.links[0].source).toBe("react");
});

test("zooms and fits the viewport with the map controls", () => {
  const { getByRole, container } = render(
    <Chart data={data} root="react" onSelectNode={() => {}} />,
  );
  const viewport = () =>
    container.querySelector(".graph-viewport").getAttribute("transform");
  const original = viewport();
  fireEvent.click(getByRole("button", { name: "Zoom in" }));
  expect(viewport()).not.toBe(original);
  fireEvent.click(getByRole("button", { name: "Fit map" }));
  expect(viewport()).toBe(original);
});

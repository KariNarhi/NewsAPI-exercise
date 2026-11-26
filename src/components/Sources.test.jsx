import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { expect, test } from "vitest";
import { makeSources } from "../testFixtures";
import Sources from "./Sources";

const renderSources = (props) =>
  render(
    <MemoryRouter>
      <Sources sources={makeSources(2)} loading={false} {...props} />
    </MemoryRouter>,
  );

test("shows only the loading text while loading", () => {
  renderSources({ loading: true });

  expect(screen.getByText("Loading...")).toBeInTheDocument();
  expect(screen.queryByRole("list")).not.toBeInTheDocument();
});

test("shows each source with its description and links", () => {
  renderSources();

  expect(screen.getAllByRole("listitem")).toHaveLength(2);
  expect(screen.getByText("Source 2")).toBeInTheDocument();
  expect(screen.getByText("Description 2")).toBeInTheDocument();

  const external = screen.getByRole("link", { name: "https://example.com/2" });
  expect(external).toHaveAttribute("href", "https://example.com/2");
  expect(external).toHaveAttribute("target", "_blank");
  expect(external).toHaveAttribute("rel", "noopener noreferrer");

  const headlines = screen.getAllByRole("link", { name: "Top headlines" });
  expect(headlines[1]).toHaveAttribute("href", "/headlines?source=source-2");
});

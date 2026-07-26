// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { Navbar } from "../../src/client/components/Navbar";

describe("Navbar Component", () => {
  it("renders brand logo and navigation links", () => {
    render(
      <MemoryRouter>
        <Navbar />
      </MemoryRouter>,
    );

    expect(screen.getByText(/GEO-VIGILANT/i)).toBeTruthy();
    expect(screen.getByText(/Overview/i)).toBeTruthy();
  });
});

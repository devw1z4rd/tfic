import { describe, it, expect, beforeEach, afterEach } from "@jest/globals";
import { createRoot } from "react-dom/client";

jest.mock("react-dom/client", () => ({
  createRoot: jest.fn(() => ({
    render: jest.fn(),
  })),
}));

jest.mock("../src/App", () => ({
  __esModule: true,
  default: () => null,
}));

describe("main.tsx", () => {
  let mockRoot: HTMLElement;

  beforeEach(() => {
    jest.clearAllMocks();

    mockRoot = document.createElement("div");
    mockRoot.id = "root";
    document.body.appendChild(mockRoot);

    const originalGetElementById = document.getElementById;
    document.getElementById = jest.fn((id) => {
      if (id === "root") return mockRoot;
      return originalGetElementById.call(document, id);
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();

    if (mockRoot.parentNode) {
      mockRoot.parentNode.removeChild(mockRoot);
    }
  });

  it("renders App component inside root element", async () => {
    await import("../src/main");

    expect(createRoot).toHaveBeenCalledWith(mockRoot);

    const mockRender = (createRoot as jest.Mock).mock.results[0].value.render;

    expect(mockRender).toHaveBeenCalled();
  });
});

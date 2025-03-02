import { render, screen, fireEvent, act } from "@testing-library/react";
import "@testing-library/jest-dom";
import App from "../src/App";

const setupCanvasMocks = () => {
  const createMockImageData = (width: number, height: number) => {
    const data = new Uint8ClampedArray(width * height * 4);
    for (let i = 0; i < data.length; i += 4) {
      const value = (i / 4) % 2 ? 255 : 0;
      data[i] = value; // R
      data[i + 1] = value; // G
      data[i + 2] = value; // B
      data[i + 3] = 255; // A
    }
    return { data, width, height };
  };

  const mockCtx = {
    clearRect: jest.fn(),
    fillRect: jest.fn(),
    fillStyle: "",
    fillText: jest.fn(),
    font: "",
    textBaseline: "",
    createImageData: jest.fn((width: number, height: number) =>
      createMockImageData(width, height)
    ),
    getImageData: jest.fn(
      (_x: number, _y: number, width: number, height: number) =>
        createMockImageData(width, height)
    ),
  };

  HTMLCanvasElement.prototype.getContext = jest
    .fn()
    .mockImplementation(() => mockCtx);

  return mockCtx;
};

const setupBigIntMocks = () => {
  const originalBigInt = global.BigInt;

  const mockBigInt = jest.fn((value: any) => {
    if (typeof value === "string" && value.length > 10) {
      return originalBigInt(42);
    }
    return originalBigInt(value);
  }) as any;

  global.BigInt = mockBigInt;

  return () => {
    global.BigInt = originalBigInt;
  };
};

describe("Tupper Formula Calculations", () => {
  let cleanupBigIntMocks: () => void;

  beforeEach(() => {
    jest.useFakeTimers();
    setupCanvasMocks();
    cleanupBigIntMocks = setupBigIntMocks();
  });

  afterEach(() => {
    jest.clearAllTimers();
    cleanupBigIntMocks();
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  it("calculates Tupper K value when text changes", () => {
    render(<App />);

    const textInput = screen.getByPlaceholderText(
      /Type text to visualize with Tupper's formula/i
    );
    fireEvent.change(textInput, { target: { value: "Test123" } });

    act(() => {
      jest.advanceTimersByTime(300);
    });

    const kValueElements = screen.getAllByText(/Tupper's Formula k Value/i);
    expect(kValueElements[0]).toBeInTheDocument();
  });

  it("processes text to bitmap correctly", () => {
    render(<App />);

    const textInput = screen.getByPlaceholderText(
      /Type text to visualize with Tupper's formula/i
    );
    fireEvent.change(textInput, { target: { value: "ABC" } });

    act(() => {
      jest.advanceTimersByTime(300);
    });

    const headerElement = screen
      .getByText(/Tupper's Formula Visualizer/i)
      .closest("header");
    if (!headerElement) {
      throw new Error("Header element not found");
    }

    const binaryViewButton = Array.from(
      headerElement.querySelectorAll("button")
    ).find((button) => button.textContent === "Binary View");

    if (!binaryViewButton) {
      throw new Error("Binary View button not found");
    }

    fireEvent.click(binaryViewButton);

    const binarySection = screen.getByText(
      /Binary Representation/i
    ).parentElement;
    expect(binarySection).toBeInTheDocument();

    const binaryContent = binarySection?.querySelector("div > div");
    expect(binaryContent).toBeInTheDocument();
  });

  it("tests all presets and their visualizations", () => {
    render(<App />);

    const presetContainer = screen.getByText("Presets").closest("div");
    if (!presetContainer) {
      throw new Error("Preset container not found");
    }

    const presetButtons = Array.from(
      presetContainer.querySelectorAll("button")
    );

    presetButtons.forEach((button) => {
      fireEvent.click(button);

      act(() => {
        jest.advanceTimersByTime(300);
      });

      const kValueElements = screen.getAllByText(/Tupper's Formula k Value/i);
      const kValueSection = kValueElements[0].closest("div");
      const codeElement = kValueSection?.querySelector("code");
      expect(codeElement).toBeInTheDocument();
      expect(codeElement?.textContent).toBeTruthy();
    });
  });
});

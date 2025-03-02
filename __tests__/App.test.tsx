import { render, screen, fireEvent, act } from "@testing-library/react";
import "@testing-library/jest-dom";
import App from "../src/App";

const createMockCanvasContext = () => ({
  clearRect: jest.fn(),
  fillRect: jest.fn(),
  fillStyle: "",
  fillText: jest.fn(),
  font: "",
  textBaseline: "",
  createImageData: jest.fn().mockReturnValue({
    data: new Uint8ClampedArray(100 * 17 * 4),
  }),
  getImageData: jest.fn().mockReturnValue({
    data: new Uint8ClampedArray(100 * 17 * 4),
  }),
});

describe("App component", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();

    HTMLCanvasElement.prototype.getContext = jest
      .fn()
      .mockImplementation(() => createMockCanvasContext());
  });

  afterEach(() => {
    jest.clearAllTimers();
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  it("renders main heading", () => {
    render(<App />);
    const headingElement = screen.getByText(/Tupper's Formula Visualizer/i);
    expect(headingElement).toBeInTheDocument();
  });

  it('opens wizard modal when "How It Works" button is clicked', () => {
    render(<App />);
    const howItWorksButton = screen.getByRole("button", {
      name: /How It Works/i,
    });
    fireEvent.click(howItWorksButton);
    const modalHeading = screen.getByText(
      /What is Tupper's Self-Referential Formula/i
    );
    expect(modalHeading).toBeInTheDocument();
  });

  it("navigates wizard modal steps and closes when finished", () => {
    render(<App />);
    const howItWorksButton = screen.getByRole("button", {
      name: /How It Works/i,
    });
    fireEvent.click(howItWorksButton);

    expect(
      screen.getByText(/What is Tupper's Self-Referential Formula/i)
    ).toBeInTheDocument();

    const nextButton = screen.getByRole("button", { name: /Next/i });
    fireEvent.click(nextButton);
    expect(screen.getByText(/How Does It Work/i)).toBeInTheDocument();

    fireEvent.click(nextButton);
    expect(screen.getByText(/Using This Tool/i)).toBeInTheDocument();

    fireEvent.click(nextButton);
    expect(screen.getByText(/Mathematical Magic/i)).toBeInTheDocument();

    fireEvent.click(nextButton);
    expect(
      screen.queryByText(/What is Tupper's Self-Referential Formula/i)
    ).not.toBeInTheDocument();
  });

  it("navigates wizard modal with Previous button", () => {
    render(<App />);
    const howItWorksButton = screen.getByRole("button", {
      name: /How It Works/i,
    });
    fireEvent.click(howItWorksButton);

    const nextButton = screen.getByRole("button", { name: /Next/i });
    fireEvent.click(nextButton);
    expect(screen.getByText(/How Does It Work/i)).toBeInTheDocument();

    const prevButton = screen.getByRole("button", { name: /Previous/i });
    fireEvent.click(prevButton);
    expect(
      screen.getByText(/What is Tupper's Self-Referential Formula/i)
    ).toBeInTheDocument();
  });

  it("handles first step in wizard with disabled Previous button", () => {
    render(<App />);
    const howItWorksButton = screen.getByRole("button", {
      name: /How It Works/i,
    });
    fireEvent.click(howItWorksButton);

    const prevButton = screen.getByRole("button", { name: /Previous/i });
    expect(prevButton).toBeDisabled();
  });

  it("closes wizard modal with X button", () => {
    render(<App />);
    const howItWorksButton = screen.getByRole("button", {
      name: /How It Works/i,
    });
    fireEvent.click(howItWorksButton);

    const closeButton = screen.getByText("×");
    fireEvent.click(closeButton);

    expect(
      screen.queryByText(/What is Tupper's Self-Referential Formula/i)
    ).not.toBeInTheDocument();
  });

  it("loads preset when preset button is clicked", () => {
    render(<App />);
    const presetButton = screen
      .getAllByRole("button")
      .find((button) => button.textContent === "LOL KEK");

    if (!presetButton) {
      throw new Error("LOL KEK button not found");
    }

    fireEvent.click(presetButton);
    const textInput = screen.getByPlaceholderText(
      /Type text to visualize with Tupper's formula/i
    );
    expect(textInput).toHaveValue("LOL KEK");
  });

  it("loads all available presets", () => {
    render(<App />);

    const presetContainer = screen.getByText("Presets").closest("div");
    if (!presetContainer) {
      throw new Error("Preset container not found");
    }

    const presetButtons = Array.from(
      presetContainer.querySelectorAll("button")
    );

    const textInput = screen.getByPlaceholderText(
      /Type text to visualize with Tupper's formula/i
    );

    presetButtons.forEach((button) => {
      fireEvent.click(button);
      expect(textInput).toHaveValue(button.textContent || "");
    });
  });

  it("toggles binary view", () => {
    render(<App />);
    expect(
      screen.queryByText(/Binary Representation/i)
    ).not.toBeInTheDocument();

    const headerElement = screen
      .getByText(/Tupper's Formula Visualizer/i)
      .closest("header");
    if (!headerElement) {
      throw new Error("Header element not found");
    }

    const binaryButton = Array.from(
      headerElement.querySelectorAll("button")
    ).find((button) => button.textContent === "Binary View");

    if (!binaryButton) {
      throw new Error("Binary View button not found");
    }

    fireEvent.click(binaryButton);
    expect(screen.getByText(/Binary Representation/i)).toBeInTheDocument();

    fireEvent.click(binaryButton);
    expect(
      screen.queryByText(/Binary Representation/i)
    ).not.toBeInTheDocument();
  });

  it("shows warning message when text is too long", () => {
    render(<App />);
    const textInput = screen.getByPlaceholderText(
      /Type text to visualize with Tupper's formula/i
    );
    const longText =
      "This is a very long text that should trigger a warning because it exceeds the threshold";
    fireEvent.change(textInput, { target: { value: longText } });

    act(() => {
      jest.advanceTimersByTime(300);
    });

    expect(screen.getByText(/Note:/i)).toBeInTheDocument();
  });

  it("shows warning for lines that are too long", () => {
    render(<App />);
    const textInput = screen.getByPlaceholderText(
      /Type text to visualize with Tupper's formula/i
    );
    const textWithLongLine =
      "Short\nThisIsAReallyLongLineWithoutAnySpacesWhichExceedsFifteenCharacters\nShort";

    fireEvent.change(textInput, { target: { value: textWithLongLine } });

    act(() => {
      jest.advanceTimersByTime(300);
    });

    expect(screen.getByText(/Note:/i)).toBeInTheDocument();
  });

  it("updates K value display when text changes", () => {
    render(<App />);
    const textInput = screen.getByPlaceholderText(
      /Type text to visualize with Tupper's formula/i
    );
    fireEvent.change(textInput, { target: { value: "Binary" } });

    act(() => {
      jest.advanceTimersByTime(300);
    });

    const sections = screen.getAllByText(/Tupper's Formula k Value/i);
    const kValueSection = sections[0].closest("div");
    if (!kValueSection) {
      throw new Error("K value section not found");
    }
  });

  it("handles text update with debounce", () => {
    render(<App />);
    const textInput = screen.getByPlaceholderText(
      /Type text to visualize with Tupper's formula/i
    );

    fireEvent.change(textInput, { target: { value: "A" } });
    fireEvent.change(textInput, { target: { value: "AB" } });
    fireEvent.change(textInput, { target: { value: "ABC" } });

    act(() => {
      jest.advanceTimersByTime(100);
    });

    fireEvent.change(textInput, { target: { value: "ABCD" } });

    act(() => {
      jest.advanceTimersByTime(300);
    });

    expect(textInput).toHaveValue("ABCD");
  });

  it("renders formula display correctly", () => {
    render(<App />);

    const formulaSections = screen.getAllByText(
      /Tupper's Self-Referential Formula/i
    );
    const formulaSection = formulaSections[0].closest("div");
    if (!formulaSection) {
      throw new Error("Formula section not found");
    }

    expect(formulaSection).toBeInTheDocument();
    const formulaText = screen.getByText(/1\/2 < ⌊mod/i);
    expect(formulaText).toBeInTheDocument();
  });

  it("displays formula visualization section", () => {
    render(<App />);

    expect(screen.getByText(/Formula Visualization/i)).toBeInTheDocument();
    expect(screen.getByText(/Tupper's Formula Plot/i)).toBeInTheDocument();
  });
});

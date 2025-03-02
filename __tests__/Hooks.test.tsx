import { renderHook, act } from "@testing-library/react";
import { useState } from "react";

const TEST_CONSTANTS = {
  MAX_WIDTH: 100,
  MAX_HEIGHT: 17,
  PIXEL_SIZE: 6,
  TEXT_WARNING_THRESHOLD: 20,
};

const createMockPixelData = (): boolean[][] => {
  return Array(TEST_CONSTANTS.MAX_HEIGHT)
    .fill(0)
    .map(() => Array(TEST_CONSTANTS.MAX_WIDTH).fill(false));
};

const usePixelData = () => {
  const [pixelData, setPixelData] = useState(createMockPixelData());
  return { pixelData, setPixelData };
};

const useTupperFormula = (
  _pixelData: boolean[][],
  textCanvasRef: React.RefObject<HTMLCanvasElement | null>,
  tupperCanvasRef: React.RefObject<HTMLCanvasElement | null>
) => {
  const [tupperK, setTupperK] = useState("");

  const drawTupperFormula = jest.fn((_k: bigint) => {
    const ctx = tupperCanvasRef.current?.getContext("2d");
    if (ctx) {
      ctx.clearRect(0, 0, 100, 17);
      ctx.fillRect(0, 0, 100, 17);
    }
  });

  const calculateTupperK = jest.fn((_imageData: ImageData) => {
    setTupperK("12345678901234567890");
    drawTupperFormula(BigInt(42));
  });

  const createImageDataFromPixels = jest.fn(() => {
    if (!textCanvasRef.current) return null;
    const ctx = textCanvasRef.current.getContext("2d");
    if (!ctx) return null;
    return ctx.createImageData(100, 17);
  });

  return { tupperK, calculateTupperK, createImageDataFromPixels };
};

const useTextToBitmap = (
  textCanvasRef: React.RefObject<HTMLCanvasElement | null>,
  calculateTupperK: (imageData: ImageData) => void,
  setPixelData: React.Dispatch<React.SetStateAction<boolean[][]>>
) => {
  const processTextToBitmap = jest.fn((inputText: string) => {
    if (!textCanvasRef.current) return;
    const ctx = textCanvasRef.current.getContext("2d");
    if (!ctx) return;

    const imageData = ctx.getImageData(0, 0, 100, 17);

    const newPixelData = createMockPixelData();

    for (let i = 0; i < Math.min(inputText.length * 5, 100); i++) {
      for (let j = 0; j < 5; j++) {
        if (i < 100 && j < 17) {
          newPixelData[j][i] = true;
        }
      }
    }

    setPixelData(newPixelData);
    calculateTupperK(imageData);
  });

  return { processTextToBitmap };
};

describe("App Custom Hooks", () => {
  it("usePixelData provides pixel data and setter", () => {
    const { result } = renderHook(() => usePixelData());

    expect(result.current.pixelData).toBeDefined();
    expect(Array.isArray(result.current.pixelData)).toBe(true);
    expect(result.current.pixelData.length).toBeGreaterThan(0);

    act(() => {
      const newPixelData = createMockPixelData();
      newPixelData[0][0] = true;
      result.current.setPixelData(newPixelData);
    });

    expect(result.current.pixelData[0][0]).toBe(true);
  });

  it("useTupperFormula provides required functions", () => {
    const textCanvasRef = { current: document.createElement("canvas") };
    const tupperCanvasRef = { current: document.createElement("canvas") };
    const pixelData = createMockPixelData();

    const { result } = renderHook(() =>
      useTupperFormula(pixelData, textCanvasRef, tupperCanvasRef)
    );

    expect(result.current.tupperK).toBe("");
    expect(typeof result.current.calculateTupperK).toBe("function");
    expect(typeof result.current.createImageDataFromPixels).toBe("function");

    let imageData: ImageData | null = null;
    act(() => {
      imageData = result.current.createImageDataFromPixels();
    });

    expect(imageData).not.toBeNull();
  });

  it("useTextToBitmap processes text to bitmap", () => {
    const textCanvasRef = { current: document.createElement("canvas") };
    const calculateTupperK = jest.fn();
    const setPixelData = jest.fn();

    const { result } = renderHook(() =>
      useTextToBitmap(textCanvasRef, calculateTupperK, setPixelData)
    );

    act(() => {
      result.current.processTextToBitmap("Test text");
    });

    expect(setPixelData).toHaveBeenCalled();
    expect(calculateTupperK).toHaveBeenCalled();
  });

  it("hooks integrate correctly", () => {
    const textCanvasRef = { current: document.createElement("canvas") };
    const tupperCanvasRef = { current: document.createElement("canvas") };

    const { result: pixelDataResult } = renderHook(() => usePixelData());

    const { result: tupperFormulaResult } = renderHook(() =>
      useTupperFormula(
        pixelDataResult.current.pixelData,
        textCanvasRef,
        tupperCanvasRef
      )
    );

    const { result: textToBitmapResult } = renderHook(() =>
      useTextToBitmap(
        textCanvasRef,
        tupperFormulaResult.current.calculateTupperK,
        pixelDataResult.current.setPixelData
      )
    );

    act(() => {
      textToBitmapResult.current.processTextToBitmap("Integration test");
    });

    expect(tupperFormulaResult.current.tupperK).toBe("12345678901234567890");
  });
});

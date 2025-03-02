import './App.css'
import React, { useState, useRef, useEffect, useCallback } from 'react'

const CONSTANTS = {
  MAX_WIDTH: 100,
  MAX_HEIGHT: 17,
  PIXEL_SIZE: 6,
  TEXT_WARNING_THRESHOLD: 20
}

const THEME = {
  background: 'rgb(10, 25, 47)',
  cardBg: '#112240',
  primary: '#64ffda',
  secondary: '#8892b0',
  text: '#e6f1ff',
  border: '#1d4ed8',
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
  inputBg: '#1e293b',
  gridLines: '#1e293b',
  buttonBg: '#3b82f6'
}

const PRESETS: { [key: string]: string } = {
  "Hello world": "Hello world",
  "LOL KEK": "LOL KEK",
  "Smile": ":)",
  "Formula": "1/2<⌊mod(⌊y/17⌋×2^(-17x),2)⌋",
  "Binary": "01010101"
}

const createEmptyPixelData = (): boolean[][] =>
  Array(CONSTANTS.MAX_HEIGHT).fill(0).map(() => Array(CONSTANTS.MAX_WIDTH).fill(false))

const usePixelData = (): {
  pixelData: boolean[][],
  setPixelData: React.Dispatch<React.SetStateAction<boolean[][]>>
} => {
  const [pixelData, setPixelData] = useState<boolean[][]>(createEmptyPixelData())
  return { pixelData, setPixelData }
}

interface TupperFormulaReturn {
  tupperK: string
  calculateTupperK: (imageData: ImageData) => void
  createImageDataFromPixels: () => ImageData | null
}

const useTupperFormula = (
  pixelData: boolean[][],
  textCanvasRef: React.RefObject<HTMLCanvasElement | null>,
  tupperCanvasRef: React.RefObject<HTMLCanvasElement | null>
): TupperFormulaReturn => {
  const [tupperK, setTupperK] = useState<string>('')

  const drawTupperFormula = useCallback((k: bigint) => {
    if (!tupperCanvasRef.current) return
    const ctx = tupperCanvasRef.current.getContext('2d')
    if (!ctx) return
    ctx.clearRect(0, 0, CONSTANTS.MAX_WIDTH * CONSTANTS.PIXEL_SIZE, CONSTANTS.MAX_HEIGHT * CONSTANTS.PIXEL_SIZE)
    ctx.fillStyle = THEME.cardBg
    ctx.fillRect(0, 0, CONSTANTS.MAX_WIDTH * CONSTANTS.PIXEL_SIZE, CONSTANTS.MAX_HEIGHT * CONSTANTS.PIXEL_SIZE)
    for (let x = 0; x < CONSTANTS.MAX_WIDTH; x++) {
      for (let y = 0; y < CONSTANTS.MAX_HEIGHT; y++) {
        const invertedY = CONSTANTS.MAX_HEIGHT - 1 - y
        const tupperY = k + BigInt(invertedY)
        const floorYDiv17 = tupperY / 17n
        const modFloorY17 = tupperY % 17n
        const exponent = 17n * BigInt(x) + modFloorY17
        const divisor = 1n << exponent
        const product = floorYDiv17 / divisor
        if (product % 2n === 1n) {
          ctx.fillStyle = THEME.text
          ctx.fillRect(
            x * CONSTANTS.PIXEL_SIZE,
            y * CONSTANTS.PIXEL_SIZE,
            CONSTANTS.PIXEL_SIZE,
            CONSTANTS.PIXEL_SIZE
          )
        }
      }
    }
  }, [tupperCanvasRef])

  const calculateTupperK = useCallback((imageData: ImageData) => {
    let k = 0n
    for (let y = 0; y < CONSTANTS.MAX_HEIGHT; y++) {
      for (let x = 0; x < CONSTANTS.MAX_WIDTH; x++) {
        const i = (y * CONSTANTS.MAX_WIDTH + x) * 4
        const pixelValue = imageData.data[i] > 128 ? 1 : 0
        const invertedY = CONSTANTS.MAX_HEIGHT - 1 - y
        const bitPosition = invertedY + CONSTANTS.MAX_HEIGHT * x
        if (pixelValue === 1) {
          k += 1n << BigInt(bitPosition)
        }
      }
    }
    k *= 17n
    setTupperK(k.toString())
    drawTupperFormula(k)
  }, [drawTupperFormula])

  const createImageDataFromPixels = useCallback((): ImageData | null => {
    if (!textCanvasRef.current) return null
    const ctx = textCanvasRef.current.getContext('2d')
    if (!ctx) return null
    const imageData = ctx.createImageData(CONSTANTS.MAX_WIDTH, CONSTANTS.MAX_HEIGHT)
    for (let y = 0; y < CONSTANTS.MAX_HEIGHT; y++) {
      for (let x = 0; x < CONSTANTS.MAX_WIDTH; x++) {
        const i = (y * CONSTANTS.MAX_WIDTH + x) * 4
        const value = pixelData[y][x] ? 255 : 0
        imageData.data[i] = value
        imageData.data[i + 1] = value
        imageData.data[i + 2] = value
        imageData.data[i + 3] = 255
      }
    }
    return imageData
  }, [pixelData, textCanvasRef])

  return { tupperK, calculateTupperK, createImageDataFromPixels }
}

interface TextToBitmapReturn {
  processTextToBitmap: (inputText: string) => void
}

const useTextToBitmap = (
  textCanvasRef: React.RefObject<HTMLCanvasElement | null>,
  calculateTupperK: (imageData: ImageData) => void,
  setPixelData: React.Dispatch<React.SetStateAction<boolean[][]>>
): TextToBitmapReturn => {
  const processTextToBitmap = useCallback((inputText: string) => {
    if (!textCanvasRef.current) return
    const canvas = textCanvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.clearRect(0, 0, CONSTANTS.MAX_WIDTH, CONSTANTS.MAX_HEIGHT)
    ctx.fillStyle = THEME.cardBg
    ctx.fillRect(0, 0, CONSTANTS.MAX_WIDTH, CONSTANTS.MAX_HEIGHT)
    ctx.font = '12px monospace'
    ctx.fillStyle = THEME.text
    ctx.textBaseline = 'top'
    const lines = inputText.split('\n')
    lines.forEach((line, index) => {
      if (index < CONSTANTS.MAX_HEIGHT - 1) {
        ctx.fillText(line, 2, index * 14, CONSTANTS.MAX_WIDTH - 4)
      }
    })
    const imageData = ctx.getImageData(0, 0, CONSTANTS.MAX_WIDTH, CONSTANTS.MAX_HEIGHT)
    const newPixelData = createEmptyPixelData()
    for (let y = 0; y < CONSTANTS.MAX_HEIGHT; y++) {
      for (let x = 0; x < CONSTANTS.MAX_WIDTH; x++) {
        const i = (y * CONSTANTS.MAX_WIDTH + x) * 4
        newPixelData[y][x] = imageData.data[i] > 128
      }
    }
    setPixelData(newPixelData)
    calculateTupperK(imageData)
  }, [textCanvasRef, calculateTupperK, setPixelData])
  return { processTextToBitmap }
}

interface WizardModalProps {
  showWizard: boolean
  setShowWizard: React.Dispatch<React.SetStateAction<boolean>>
  wizardStep: number
  setWizardStep: React.Dispatch<React.SetStateAction<number>>
}

const WizardModal: React.FC<WizardModalProps> = ({ showWizard, setShowWizard, wizardStep, setWizardStep }) => {
  if (!showWizard) return null

  const navigateWizard = (step: number) => {
    if (step < 1) step = 1
    if (step > 4) {
      setShowWizard(false)
      return
    }
    setWizardStep(step)
  }

  const getWizardContent = () => {
    switch (wizardStep) {
      case 1:
        return (
          <div>
            <h3 className="text-xl font-bold mb-2" style={{ color: THEME.primary }}>
              What is Tupper's Self-Referential Formula?
            </h3>
            <p className="mb-2" style={{ color: THEME.text }}>
              Tupper's self-referential formula is a mathematical curiosity that can visually represent any bitmap image when given a specific value k.
            </p>
            <p style={{ color: THEME.text }}>
              It was created by mathematician Jeff Tupper in 2001 and has the fascinating property of being able to plot itself!
            </p>
          </div>
        )
      case 2:
        return (
          <div>
            <h3 className="text-xl font-bold mb-2" style={{ color: THEME.primary }}>
              How Does It Work?
            </h3>
            <p className="mb-2" style={{ color: THEME.text }}>
              The formula creates a grid of pixels. For each point (x,y) in the grid, the formula decides whether that pixel should be filled or not.
            </p>
            <p style={{ color: THEME.text }}>
              When the correct (extremely large) value of k is used, the formula will plot any desired image, including text!
            </p>
          </div>
        )
      case 3:
        return (
          <div>
            <h3 className="text-xl font-bold mb-2" style={{ color: THEME.primary }}>
              Using This Tool
            </h3>
            <p className="mb-2" style={{ color: THEME.text }}>
              1. Type text in the input field or choose a preset
            </p>
            <p className="mb-2" style={{ color: THEME.text }}>
              2. The text is converted into a massive number (k value)
            </p>
            <p style={{ color: THEME.text }}>
              3. When that k value is fed into Tupper's formula, it recreates your original text!
            </p>
          </div>
        )
      case 4:
        return (
          <div>
            <h3 className="text-xl font-bold mb-2" style={{ color: THEME.primary }}>
              Mathematical Magic
            </h3>
            <p className="mb-2" style={{ color: THEME.text }}>
              The huge k value at the bottom uniquely defines your text.
            </p>
            <p style={{ color: THEME.text }}>
              This demonstrates how mathematical formulas can encode and reproduce visual information — a fundamental concept in computer graphics and image processing.
            </p>
          </div>
        )
      default:
        return null
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="max-w-2xl w-full rounded-lg shadow-2xl p-6 relative" style={{ backgroundColor: THEME.cardBg }}>
        <button
          onClick={() => setShowWizard(false)}
          className="absolute top-3 right-3 text-2xl p-1 rounded hover:bg-opacity-20 transition-colors"
          style={{ color: THEME.secondary, backgroundColor: 'transparent' }}
        >
          ×
        </button>
        {getWizardContent()}
        <div className="flex justify-between mt-6 pt-4" style={{ borderTop: `1px solid ${THEME.secondary}30` }}>
          <button
            onClick={() => navigateWizard(wizardStep - 1)}
            className="px-4 py-2 rounded-md transition-colors"
            disabled={wizardStep === 1}
            style={{
              backgroundColor: wizardStep === 1 ? `${THEME.secondary}30` : THEME.buttonBg,
              color: THEME.text,
              cursor: wizardStep === 1 ? 'not-allowed' : 'pointer'
            }}
          >
            Previous
          </button>
          <div className="flex space-x-2">
            {[1, 2, 3, 4].map(step => (
              <div key={step} className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: wizardStep === step ? THEME.primary : `${THEME.secondary}30` }} />
            ))}
          </div>
          <button
            onClick={() => navigateWizard(wizardStep + 1)}
            className="px-4 py-2 rounded-md transition-colors"
            style={{ backgroundColor: THEME.buttonBg, color: THEME.text }}
          >
            {wizardStep === 4 ? 'Close' : 'Next'}
          </button>
        </div>
      </div>
    </div>
  )
}

interface HeaderProps {
  showBinaryView: boolean
  toggleBinaryView: () => void
  setShowWizard: React.Dispatch<React.SetStateAction<boolean>>
  setWizardStep: React.Dispatch<React.SetStateAction<number>>
}

const Header: React.FC<HeaderProps> = ({ showBinaryView, toggleBinaryView, setShowWizard, setWizardStep }) => (
  <header className="w-full max-w-6xl flex flex-col md:flex-row justify-between items-center mb-6">
    <h1 className="text-2xl sm:text-3xl font-bold mb-4 md:mb-0" style={{ color: THEME.primary }}>
      Tupper's Formula Visualizer
    </h1>
    <div className="flex flex-wrap gap-3 justify-center">
      <button
        onClick={() => {
          setShowWizard(true)
          setWizardStep(1)
        }}
        className="px-3 py-1.5 rounded-md text-sm transition-colors"
        style={{ backgroundColor: THEME.buttonBg, color: THEME.text }}
      >
        How It Works
      </button>
      <button
        onClick={toggleBinaryView}
        className="px-3 py-1.5 rounded-md text-sm transition-colors"
        style={{
          backgroundColor: showBinaryView ? THEME.primary : `${THEME.buttonBg}80`,
          color: showBinaryView ? THEME.cardBg : THEME.text
        }}
      >
        Binary View
      </button>
    </div>
  </header>
)

interface TextInputProps {
  inputText: string
  handleTextChange: React.ChangeEventHandler<HTMLTextAreaElement>
  textTooLong: boolean
}

const TextInput: React.FC<TextInputProps> = ({ inputText, handleTextChange, textTooLong }) => (
  <div className="rounded-lg shadow-md overflow-hidden" style={{ backgroundColor: THEME.cardBg }}>
    <div className="px-4 py-3 font-medium" style={{ backgroundColor: `${THEME.primary}15`, color: THEME.text }}>
      Enter text to visualize:
    </div>
    <div className="p-4">
      <textarea
        className="w-full p-3 rounded-md focus:outline-none focus:ring-2 transition-colors"
        value={inputText}
        onChange={handleTextChange}
        rows={5}
        placeholder="Type text to visualize with Tupper's formula..."
        style={{
          backgroundColor: THEME.inputBg,
          color: THEME.text,
          borderColor: textTooLong ? THEME.warning : THEME.border
        }}
      />
      {textTooLong && (
        <div className="mt-2 p-3 rounded-md text-sm" style={{ backgroundColor: `${THEME.warning}20`, borderLeft: `4px solid ${THEME.warning}`, color: THEME.warning }}>
          <strong>Note:</strong> Text is getting long and may not display well. For best results, keep text short.
        </div>
      )}
    </div>
  </div>
)

interface PresetSelectorProps {
  loadPreset: (preset: string) => void
}

const PresetSelector: React.FC<PresetSelectorProps> = ({ loadPreset }) => (
  <div className="rounded-lg shadow-md overflow-hidden" style={{ backgroundColor: THEME.cardBg }}>
    <div className="px-4 py-3 font-medium" style={{ backgroundColor: `${THEME.primary}15`, color: THEME.text }}>
      Presets
    </div>
    <div className="p-4">
      <div className="flex flex-wrap gap-2">
        {Object.entries(PRESETS).map(([name, value]) => (
          <button
            key={name}
            onClick={() => loadPreset(value)}
            className="px-3 py-1.5 rounded-md text-sm transition-colors"
            style={{ backgroundColor: `${THEME.buttonBg}60`, color: THEME.text }}
          >
            {name}
          </button>
        ))}
      </div>
    </div>
  </div>
)

const FormulaDisplay: React.FC = () => (
  <div className="rounded-lg shadow-md overflow-hidden" style={{ backgroundColor: THEME.cardBg }}>
    <div className="px-4 py-3 font-medium" style={{ backgroundColor: `${THEME.primary}15`, color: THEME.text }}>
      Tupper's Self-Referential Formula
    </div>
    <div className="p-4">
      <div className="p-4 rounded-md text-center bg-opacity-30 backdrop-blur-sm" style={{ backgroundColor: THEME.cardBg, color: THEME.text }}>
        <div className="overflow-x-auto font-mono text-base md:text-lg whitespace-nowrap">
          <span>1/2 &lt; ⌊mod(⌊y/17⌋ × 2</span>
          <span style={{ color: THEME.primary }}>
            <sup>{`(-17 × ⌊x⌋ - mod(⌊y⌋, 17))`}</sup>
          </span>
          <span>, 2)⌋</span>
        </div>
      </div>
    </div>
  </div>
)

interface FormulaVisualizationProps {
  textCanvasRef: React.RefObject<HTMLCanvasElement | null>
  tupperCanvasRef: React.RefObject<HTMLCanvasElement | null>
}

const FormulaVisualization: React.FC<FormulaVisualizationProps> = ({ textCanvasRef, tupperCanvasRef }) => (
  <div className="rounded-lg shadow-md overflow-hidden" style={{ backgroundColor: THEME.cardBg }}>
    <div className="px-4 py-3 font-medium" style={{ backgroundColor: `${THEME.primary}15`, color: THEME.text }}>
      Formula Visualization
    </div>
    <div className="p-4">
      <div className="flex flex-col items-center gap-6">
        <canvas ref={textCanvasRef} width={CONSTANTS.MAX_WIDTH} height={CONSTANTS.MAX_HEIGHT} className="hidden" />
        <div>
          <p className="text-center mb-2 font-medium" style={{ color: THEME.text }}>
            Tupper's Formula Plot
          </p>
          <div className="rounded-md overflow-hidden shadow-inner p-2" style={{ backgroundColor: `${THEME.cardBg}80` }}>
            <canvas
              ref={tupperCanvasRef}
              width={CONSTANTS.MAX_WIDTH * CONSTANTS.PIXEL_SIZE}
              height={CONSTANTS.MAX_HEIGHT * CONSTANTS.PIXEL_SIZE}
              className="mx-auto"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
)

interface KValueDisplayProps {
  tupperK: string
}

const KValueDisplay: React.FC<KValueDisplayProps> = ({ tupperK }) => (
  <div className="rounded-lg shadow-md overflow-hidden" style={{ backgroundColor: THEME.cardBg }}>
    <div className="px-4 py-3 font-medium" style={{ backgroundColor: `${THEME.primary}15`, color: THEME.text }}>
      Tupper's Formula k Value
    </div>
    <div className="p-4">
      {tupperK && (
        <div style={{ color: THEME.text }}>
          <div className="bg-opacity-30 rounded-md p-3 overflow-auto text-xs font-mono max-h-20" style={{ backgroundColor: THEME.inputBg }}>
            <code>{tupperK}</code>
          </div>
          <p className="text-sm mt-2 opacity-70">
            This k value is the input to Tupper's self-referential formula to generate the visualization.
          </p>
        </div>
      )}
    </div>
  </div>
)

interface BinaryViewProps {
  showBinaryView: boolean
  pixelData: boolean[][]
}

const BinaryView: React.FC<BinaryViewProps> = ({ showBinaryView, pixelData }) => {
  if (!showBinaryView) return null
  return (
    <div className="rounded-lg shadow-md overflow-hidden" style={{ backgroundColor: THEME.cardBg }}>
      <div className="px-4 py-3 font-medium" style={{ backgroundColor: `${THEME.primary}15`, color: THEME.text }}>
        Binary Representation
      </div>
      <div className="p-4">
        <div className="bg-opacity-30 rounded-md p-3 overflow-auto text-xs font-mono" style={{ backgroundColor: THEME.inputBg }}>
          {pixelData.map((row, y) => (
            <div key={y} className="whitespace-nowrap">
              {row.map((pixel, x) => (
                <span key={`${x}-${y}`} style={{ color: pixel ? THEME.primary : `${THEME.secondary}50` }}>
                  {pixel ? '1' : '0'}
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

const App: React.FC = () => {
  const [inputText, setInputText] = useState<string>('Hello world')
  const [textTooLong, setTextTooLong] = useState<boolean>(false)
  const [showBinaryView, setShowBinaryView] = useState<boolean>(false)
  const [showWizard, setShowWizard] = useState<boolean>(false)
  const [wizardStep, setWizardStep] = useState<number>(1)

  const textCanvasRef = useRef<HTMLCanvasElement | null>(null)
  const tupperCanvasRef = useRef<HTMLCanvasElement | null>(null)

  const { pixelData, setPixelData } = usePixelData()
  const { tupperK, calculateTupperK } = useTupperFormula(pixelData, textCanvasRef, tupperCanvasRef)
  const { processTextToBitmap } = useTextToBitmap(textCanvasRef, calculateTupperK, setPixelData)

  const toggleBinaryView = () => setShowBinaryView(prev => !prev)
  const loadPreset = (preset: string) => setInputText(preset)

  const handleTextChange: React.ChangeEventHandler<HTMLTextAreaElement> = (e) => {
    const newText = e.target.value
    setInputText(newText)
    const totalChars = newText.length
    const lines = newText.split('\n')
    const longestLine = Math.max(...lines.map(line => line.length))
    setTextTooLong(totalChars > CONSTANTS.TEXT_WARNING_THRESHOLD || longestLine > 15)
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      processTextToBitmap(inputText)
    }, 300)
    return () => clearTimeout(timer)
  }, [inputText, processTextToBitmap])

  useEffect(() => {
    processTextToBitmap(inputText)
  }, [processTextToBitmap, inputText])

  return (
    <div className="flex flex-col items-center justify-center w-full min-h-screen p-4 sm:p-6 rounded-md" style={{ backgroundColor: THEME.background }}>
      <Header showBinaryView={showBinaryView} toggleBinaryView={toggleBinaryView} setShowWizard={setShowWizard} setWizardStep={setWizardStep} />
      <WizardModal showWizard={showWizard} setShowWizard={setShowWizard} wizardStep={wizardStep} setWizardStep={setWizardStep} />
      <div className="w-full max-w-6xl flex flex-col md:flex-row gap-6">
        <div className="w-full md:w-5/12 flex flex-col gap-5">
          <TextInput inputText={inputText} handleTextChange={handleTextChange} textTooLong={textTooLong} />
          <PresetSelector loadPreset={loadPreset} />
        </div>
        <div className="w-full md:w-7/12 flex flex-col gap-5">
          <FormulaDisplay />
          <FormulaVisualization textCanvasRef={textCanvasRef} tupperCanvasRef={tupperCanvasRef} />
          <KValueDisplay tupperK={tupperK} />
          <BinaryView showBinaryView={showBinaryView} pixelData={pixelData} />
        </div>
      </div>
    </div>
  )
}

export default App

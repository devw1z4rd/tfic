# Tupper's Formula Visualizer

## Abstract
The **Tupper's Formula Visualizer** is a computational tool designed to illustrate the self-referential properties of Tupper’s formula through interactive visualization. The application translates user-specified textual input into a numerical `k` parameter, which is subsequently utilized within Tupper’s inequality to reconstruct the text as a discrete binary representation. This project demonstrates the intersection of mathematical encoding, computational algebra, and digital visualization techniques.

## Problem Statement
Tupper’s self-referential formula is a piecewise-defined inequality that, when evaluated over a specific domain, produces a 106×17 binary image corresponding to an encoded integer `k`. The core problem addressed by this implementation is the algorithmic conversion of arbitrary textual input into a numerical encoding compatible with Tupper’s construct, followed by the efficient rendering of the resultant visual pattern.

## Methodology
1. **Symbolic Encoding:** Input text is converted into a pixel-based binary matrix adhering to the 106×17 resolution constraint imposed by Tupper’s formula.
2. **Numerical Mapping:** The binary representation is transformed into a single integer `k` by leveraging positional encoding and bitwise manipulations.
3. **Mathematical Application:** The computed `k` is injected into Tupper’s formula, which is then evaluated within the domain constraints to reconstruct the visualized text.
4. **Computational Rendering:** The resultant binary matrix is graphically displayed using React components, ensuring efficient real-time visualization with Tailwind CSS for styling.

## Technology Stack
- **Frontend Framework:** React (TypeScript)
- **Development Environment:** Vite
- **Styling & UI:** Tailwind CSS
- **Code Quality & Testing:** ESLint, Jest, Testing Library
- **Continuous Deployment:** GitHub Actions

## Installation & Usage
### Prerequisites
- Node.js (latest stable version)
- npm or yarn package manager

### Installation Steps
1. Clone the repository:
   ```sh
   git clone https://github.com/devw1z4rd/tfic.git
   cd tfic
   ```
2. Install dependencies:
   ```sh
   npm install  # or yarn install
   ```
3. Run the development server:
   ```sh
   npm run dev  # or yarn dev
   ```
4. Open a browser and navigate to `http://localhost:5173` to access the application.

### Build & Deployment
To create an optimized production build, execute:
```sh
npm run build  # or yarn build
```
The compiled output will be stored in the `dist/` directory.

### Testing
This project includes automated unit testing with Jest and Testing Library. Execute the test suite using:
```sh
npm run test  # or yarn test
```

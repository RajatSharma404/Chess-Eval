<div align="center">
  <img src="https://raw.githubusercontent.com/RajatSharma404/Chess-Eval/main/frontend/public/favicon.ico" alt="MasterMind Logo" width="100"/>
  <h1>🧠 MasterMind - Advanced Chess Evaluation Platform</h1>
  <p><i>Professional-grade chess analysis powered by Stockfish 17 and Google Gemini 2.0 AI.</i></p>

  [![License: MIT](https://img.shields.io/badge/License-MIT-emerald.svg)](https://opensource.org/licenses/MIT)
</div>

## 🌟 Overview

MasterMind is a premium, high-performance web application designed to help chess players of all levels analyze their games, discover tactical blunders, and learn from their mistakes using natural language explanations. 

Instead of just showing raw engine variations (like `+2.5` or `Nf3+`), MasterMind utilizes **Google Gemini 2.0** to explain *why* a move is bad in plain English, while simultaneously drawing visual, colored arrows directly on the board to illustrate the AI's thoughts.

It features a stunning, dark-mode focused UI that rivals top-tier platforms like Chess.com and Lichess, complete with real-time evaluation bars, accuracy gauges, interactive move lists, and branching "what-if" analysis boards.

---

## 🚀 Key Features

* **Real-time WebSocket Engine Analysis:** Uses `Stockfish 17` on the backend via WebSockets to stream evaluation data, centipawn scores, and top 3 best engine variations (`Multi-PV`) live to the frontend.
* **AI Natural Language Insights:** Integrates `Gemini 2.0 Flash` to read the board state before and after a blunder. It generates structured JSON responses containing a human-readable explanation and visual SVG arrow coordinates.
* **Chrome Extension Integration:** Includes a custom browser extension that detects when a game ends on **Chess.com** or **Lichess** and automatically teleports the game to the MasterMind laboratory for instant analysis.
* **Non-Destructive Branching:** Play out hypothetical variations ("What if I moved here instead?") directly on the analysis board. The platform intelligently saves the mainline game state, allowing you to instantly "Restore Mainline" via a sticky button.
* **Professional UI Metrics:**
  * **Accuracy Dashboard:** Calculates and displays Lichess-style accuracy percentages (e.g., `94.2%`) for both White and Black.
  * **Game Trajectory Chart:** An interactive `Recharts` graph plotting the evaluation score over the course of the entire game.
  * **Classification Badges:** Chess.com-style visual icons (`!!`, `★`, `?`, `??`) embedded directly in the move list.
* **Redis Caching Engine:** Heavily caches analyzed positions and PGNs in Redis to prevent redundant engine calculations and API rate limits, ensuring lightning-fast load times for previously analyzed games.

---

## 🛠️ Technology Stack

**Frontend:**
* **Next.js 15 (App Router)** - React framework for UI.
* **Zustand** - High-performance, lightweight global state management (handles branching logic).
* **React Chessboard** - Renders the SVG chess board and custom AI arrows.
* **TailwindCSS** - Premium glassmorphism and animated styling.
* **Recharts** - Dynamic SVG-based graphing library.

**Backend:**
* **FastAPI** - Async Python framework for WebSockets and REST APIs.
* **Python-Chess** - Core chess logic, move validation, and PGN parsing.
* **Stockfish 17** - World's strongest open-source chess engine.
* **Google Generative AI (Gemini)** - LLM for tactical explanations.
* **Redis** - In-memory data store for ultra-fast caching.
* **Docker / Docker Compose** - Containerization for isolated Stockfish and Redis environments.

---

## 📦 Architecture & Flow

1. **Input:** The user pastes a raw PGN, a Lichess/Chess.com URL, or uses the Chrome Extension.
2. **Scraping:** The `fetcher.py` module bypasses CORS by allowing the Python server to directly scrape the raw PGN from the provided URLs.
3. **Analysis Stream:** The frontend opens a WebSocket (`/ws/analyze`) connection. The backend streams real-time progress updates ("Analyzing move 15/40...") so the UI never feels frozen.
4. **Classification:** Every move is passed through `classifier.py` which calculates Centipawn Loss (CPL) to categorize the move as Best, Excellent, Good, Inaccuracy, Mistake, or Blunder.
5. **AI Suggestions:** If a move is a Mistake or Blunder, `suggestions.py` makes an asynchronous call to Gemini to generate coaching advice.
6. **Delivery:** The final `AnalysisResult` JSON is cached in Redis and sent back to the frontend, where `useGameStore.ts` orchestrates the UI components.

---

## 🧩 Chrome Extension (MasterMind Analyst)

The project includes a companion Chrome Extension located in the `/extension` directory.

### What it does:
* Constantly monitors your active tab.
* The moment it detects a game finishing on Chess.com or Lichess (e.g., detecting the Game Over modal), it throws a massive, pulsing "Analyze in MasterMind" overlay.
* Grabs the URL, redirects to `http://localhost:3003`, and automatically begins downloading the PGN to analyze it.

### How to install:
1. Open Google Chrome and navigate to `chrome://extensions`.
2. Toggle **Developer mode** (top right corner).
3. Click **Load unpacked** (top left).
4. Select the `Chess-Game-Eval/extension` folder.

---

## 💻 Local Setup & Installation

### 1. Prerequisites
* **Docker & Docker Compose** (For running Redis and the Backend)
* **Node.js 18+** (For running the Next.js Frontend)
* A **Gemini API Key** from Google AI Studio.

### 2. Environment Variables
Create a `.env` file in the root directory:
```env
GEMINI_API_KEY="your_api_key_here"
```

### 3. Start the Backend & Redis
We use Docker to ensure Stockfish 17 and Redis are properly configured without cluttering your host machine.
```bash
docker-compose up --build -d
```
*The FastAPI backend will run on `http://localhost:8000`.*

### 4. Start the Frontend
Open a new terminal window:
```bash
cd frontend
npm install
npm run dev
```
*The Next.js frontend will run on `http://localhost:3003`.*

---

## 📜 License

This project is licensed under the **MIT License**. See the `LICENSE` file for details. You are free to use, modify, and distribute this software for personal or commercial projects.

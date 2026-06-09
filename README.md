# MasterMind - Chess Game Evaluator

A premium chess analysis platform powered by Stockfish 17 and Gemini 2.0 Flash.

## Features
- **Engine Analysis**: Full move-by-move evaluation using Stockfish 17.
- **AI Suggester**: Explains blunders and mistakes using Google Gemini 2.0.
- **Accuracy Tracking**: Lichess-style accuracy percentages for both players.
- **Dynamic Eval Bar**: Real-time evaluation visualization.
- **Interactive Board**: Jump to any move, see best move arrows for errors.

## Setup Instructions

### Prerequisites
- Docker & Docker Compose
- Gemini API Key (from Google AI Studio)

### Environment Variables

#### Backend (.env in backend folder)
```env
STOCKFISH_PATH=/usr/bin/stockfish
GEMINI_API_KEY=your_gemini_key
REDIS_URL=redis://redis:6379
```

#### Frontend (.env.local in frontend folder)
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### Running Locally with Docker
1. Clone the repo.
2. In the root directory, create a `.env` file for Docker Compose:
   ```env
   GEMINI_API_KEY=your_key_here
   ```
3. Run:
   ```bash
   docker-compose up --build
   ```
4. Frontend:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

## Tech Stack
- **Backend**: FastAPI, python-chess, Redis
- **Frontend**: Next.js 15, Zustand, Recharts, react-chessboard
- **AI**: Gemini 2.0 Flash

import hashlib
import json
import os
from dotenv import load_dotenv

# Load env variables from root and backend directories
load_dotenv()                 # loads .env in the current working directory
load_dotenv("backend/.env")    # loads backend/.env if run from project root
load_dotenv("../.env")        # loads root .env if run from backend directory

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import redis
from concurrent.futures import ThreadPoolExecutor
import asyncio

from fetcher import fetch_pgn
from analyzer import analyze_game
from suggestions import generate_suggestions

from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

redis_url = os.getenv("REDIS_URL", "redis://localhost:6379")
redis_client = redis.from_url(redis_url)

@app.get("/health")
def health():
    return {"status": "ok"}

@app.websocket("/ws/analyze")
async def websocket_analyze(websocket: WebSocket):
    await websocket.accept()
    try:
        data = await websocket.receive_json()
        game_url = data.get("game_url")
        if not game_url:
            await websocket.send_json({"type": "error", "message": "No game URL provided"})
            return
            
        url_hash = hashlib.sha256(game_url.encode()).hexdigest()
        
        try:
            cached = redis_client.get(url_hash)
            if cached:
                await websocket.send_json({"type": "complete", "analysis": json.loads(cached)})
                return
        except:
            pass

        pgn = fetch_pgn(game_url)
        
        async def progress_cb(current, total):
            await websocket.send_json({
                "type": "progress", 
                "status": f"Analyzing move {current+1}/{total}...", 
                "progress": int((current / total) * 100)
            })

        analysis = await analyze_game(pgn, progress_callback=progress_cb)
        
        await websocket.send_json({"type": "progress", "status": "Generating AI suggestions...", "progress": 95})
        suggestions = await generate_suggestions(analysis["moves"])
        analysis["suggestions"] = suggestions
        
        try:
            redis_client.setex(url_hash, 86400, json.dumps(analysis))
        except:
            pass
            
        await websocket.send_json({"type": "complete", "analysis": analysis})
    except WebSocketDisconnect:
        print("Client disconnected")
    except Exception as e:
        await websocket.send_json({"type": "error", "message": str(e)})

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

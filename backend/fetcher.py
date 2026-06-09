import requests
import re
from fastapi import HTTPException

def fetch_pgn(url: str) -> str:
    # Direct PGN check
    if url.strip().startswith("[Event"):
        return url

    # Lichess URL Parsing
    lichess_match = re.search(r"lichess\.org/([a-zA-Z0-9]{8,12})", url)
    if lichess_match:
        game_id = lichess_match.group(1)
        response = requests.get(
            f"https://lichess.org/game/export/{game_id}",
            headers={"Accept": "application/x-chess-pgn"}
        )
        if response.status_code == 200:
            return response.text
        raise HTTPException(status_code=404, detail="Lichess game not found")

    # Chess.com URL Parsing
    # Patterns: chess.com/game/live/ID, chess.com/analysis/game/live/ID, chess.com/game/ID etc.
    chess_match = re.search(r"chess\.com/(?:analysis/)?game/(?:([a-zA-Z0-9_-]+)/)?(\d+)", url)
    if chess_match:
        game_type = chess_match.group(1)
        game_id = chess_match.group(2)
        
        if game_type:
            fetch_url = f"https://www.chess.com/game/{game_type}/{game_id}"
        else:
            fetch_url = f"https://www.chess.com/game/{game_id}"
        
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36"
        }
        try:
            response = requests.get(fetch_url, headers=headers, timeout=10)
            if response.status_code == 200:
                # The PGN is often embedded in a JSON object inside the page source
                pgn_match = re.search(r'"pgn":"([^"]+)"', response.text)
                if pgn_match:
                    pgn_data = pgn_match.group(1)
                    # Handle escapes
                    pgn = pgn_data.encode().decode('unicode_escape')
                    return pgn
        except Exception as e:
            print(f"Chess.com Fetch Error: {e}")

        raise HTTPException(
            status_code=400, 
            detail="Could not extract PGN from Chess.com URL. Please ensure the game is public or paste the PGN directly."
        )

    raise HTTPException(status_code=400, detail="Unrecognized game URL or PGN format")

import os
import asyncio
import google.generativeai as genai

async def generate_suggestions(moves: list) -> list:
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        return []
        
    genai.configure(api_key=api_key)
    model = genai.GenerativeModel('gemini-2.0-flash')
    suggestions = []
    
    critical_moves = [m for m in moves if m["classification"] in ["blunder", "mistake"]][:5]
    
    async def fetch_suggestion(m):
        prompt = (
            f"A chess player made move {m['move_san']} in this position (FEN: {m['fen_before']}). "
            f"Stockfish says the best move was {m['best_move_san']} with an evaluation of +{m['eval_after_cp']/100:.1f}. "
            f"The played move caused a loss of {m['cp_loss']} centipawns. "
            f"Explain why the engine move was better, in exactly 2 sentences for an intermediate player. "
            f"Also provide the engine's best move as a from-to square pair (e.g. ['e2', 'e4']). "
            f"Return ONLY valid JSON in this exact format: {{\"explanation\": \"...\", \"arrow\": [\"from\", \"to\"]}}"
        )
        try:
            response = await model.generate_content_async(prompt)
            import json
            import re
            
            # Extract JSON block in case there's markdown around it
            json_text = response.text.strip()
            match = re.search(r'\{.*\}', json_text, re.DOTALL)
            if match:
                json_text = match.group(0)
            
            data = json.loads(json_text)
            
            return {
                "move_index": moves.index(m),
                "move_san": m["move_san"],
                "suggestion_text": data.get("explanation", ""),
                "arrow": data.get("arrow", [])
            }
        except Exception as e:
            print(f"Gemini Error: {e}")
            return None

    results = await asyncio.gather(*(fetch_suggestion(m) for m in critical_moves))
    
    for res in results:
        if res:
            suggestions.append(res)
            
    return suggestions

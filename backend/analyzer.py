import chess
import chess.engine
import chess.pgn
import io
import os
import math
import json
from classifier import classify_move

STOCKFISH_PATH = os.getenv("STOCKFISH_PATH", "/usr/bin/stockfish")

def win_prob(cp: float) -> float:
    # Cap cp to avoid overflow
    cp = max(-10000, min(10000, cp))
    return 50 + 50 * (2 / (1 + math.exp(-0.00368208 * cp)) - 1)

def calculate_accuracy(avg_win_prob_loss: float) -> float:
    if avg_win_prob_loss <= 0: return 100.0
    accuracy = 103.1668 * math.exp(-0.04354 * avg_win_prob_loss) - 3.1669
    return max(0, min(100, accuracy))

async def analyze_game(pgn_str: str, progress_callback=None) -> dict:
    pgn = io.StringIO(pgn_str)
    game = chess.pgn.read_game(pgn)
    if not game:
        raise ValueError("Invalid PGN")

    transport, engine = await chess.engine.popen_uci(STOCKFISH_PATH)
    board = game.board()
    moves_analysis = []
    
    white_cpl = []
    black_cpl = []
    max_cpl = -1
    critical_index = 0

    # Get Opening
    opening = game.headers.get("Opening")
    if not opening:
        eco_url = game.headers.get("ECOUrl")
        if eco_url:
            opening = eco_url.split("/")[-1].replace("-", " ")
        else:
            eco_code = game.headers.get("ECO", "")
            try:
                with open("eco_map.json", "r") as f:
                    eco_map = json.load(f)
                opening = eco_map.get(eco_code, f"{eco_code} Unknown Opening" if eco_code else "Unknown Opening")
            except:
                opening = f"{eco_code} Unknown Opening" if eco_code else "Unknown Opening"

    total_moves = sum(1 for _ in game.mainline_moves())
    
    # Reload game to iterate again
    pgn = io.StringIO(pgn_str)
    game = chess.pgn.read_game(pgn)
    board = game.board()

    for i, move in enumerate(game.mainline_moves()):
        if progress_callback:
            await progress_callback(i, total_moves)

        fen_before = board.fen()
        
        # Analyze current position with multipv
        info_before_list = await engine.analyse(board, chess.engine.Limit(depth=18), multipv=3)
        if not isinstance(info_before_list, list):
            info_before_list = [info_before_list]
            
        info_before = info_before_list[0]
        eval_before_white = info_before["score"].white().score(mate_score=10000)
        eval_before_rel = info_before["score"].relative.score(mate_score=10000)
        best_move = info_before.get("pv", [None])[0]
        
        top_3_moves = []
        for pv_info in info_before_list:
            pv_move = pv_info.get("pv", [None])[0]
            if pv_move:
                san_move = board.san(pv_move)
                score = pv_info["score"].relative.score(mate_score=10000)
                # Convert relative score to white's perspective if needed, but relative is fine for showing alternatives
                top_3_moves.append({"move_san": san_move, "cp": pv_info["score"].white().score(mate_score=10000)})
        
        captured_piece = board.is_capture(move)
        
        board.push(move)
        fen_after = board.fen()
        
        # Eval after move (single PV is fine here since we just need the eval of the position)
        info_after = await engine.analyse(board, chess.engine.Limit(depth=18))
        eval_after_white = info_after["score"].white().score(mate_score=10000)
        eval_after_rel = -info_after["score"].relative.score(mate_score=10000)
        
        cp_loss = max(0, eval_before_rel - eval_after_rel)
        wp_loss = max(0, win_prob(eval_before_rel) - win_prob(eval_after_rel))
        is_best = (move == best_move)
        classification = classify_move(cp_loss, is_best, captured_piece)

        # SAN before push
        board.pop()
        move_san = board.san(move)
        best_move_san = board.san(best_move) if best_move else None
        board.push(move)

        move_data = {
            "move_number": (i // 2) + 1,
            "color": "white" if i % 2 == 0 else "black",
            "move_san": move_san,
            "move_uci": move.uci(),
            "fen_before": fen_before,
            "fen_after": fen_after,
            "eval_before_cp": eval_before_white,
            "eval_after_cp": eval_after_white,
            "best_move_uci": best_move.uci() if best_move else None,
            "best_move_san": best_move_san,
            "top_3_moves": top_3_moves,
            "cp_loss": cp_loss,
            "classification": classification
        }

        moves_analysis.append(move_data)

        if i % 2 == 0: white_cpl.append(wp_loss)
        else: black_cpl.append(wp_loss)

        if cp_loss > max_cpl:
            max_cpl = cp_loss
            critical_index = i

    await engine.quit()

    white_acc = calculate_accuracy(sum(white_cpl)/len(white_cpl)) if white_cpl else 100
    black_acc = calculate_accuracy(sum(black_cpl)/len(black_cpl)) if black_cpl else 100

    return {
        "opening": opening,
        "white_accuracy": white_acc,
        "black_accuracy": black_acc,
        "critical_move_index": critical_index,
        "moves": moves_analysis
    }

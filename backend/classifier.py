def classify_move(cp_loss: int, is_best: bool, captured_piece: bool = False) -> str:
    if is_best and captured_piece:
        return "brilliant"
    if is_best or cp_loss <= 0:
        return "best"
    if cp_loss < 20:
        return "good"
    if 20 <= cp_loss < 100:
        return "inaccuracy"
    if 100 <= cp_loss < 300:
        return "mistake"
    return "blunder"

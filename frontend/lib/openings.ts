import openingsData from '../data/openings.json';
import { Move } from '../store/useGameStore';

export interface Opening {
    eco: string;
    name: string;
}

const openings: Record<string, Opening> = openingsData;

function getBaseFen(fen: string): string {
    return fen.split(' ').slice(0, 4).join(' ');
}

export function getCurrentOpening(moves: Move[], currentIndex: number): Opening {
    if (currentIndex < 0 || !moves || moves.length === 0) {
        return { eco: '?', name: 'Starting Position' };
    }
    
    // Find the deepest matching opening from currentIndex backwards to 0
    for (let i = currentIndex; i >= 0; i--) {
        const fen = moves[i].fen_after;
        if (!fen) continue;
        
        const baseFen = getBaseFen(fen);
        if (openings[baseFen]) {
            return openings[baseFen];
        }
    }
    
    return { eco: '?', name: 'Starting Position' };
}

export function getGameOpening(moves: Move[]): Opening {
    return getCurrentOpening(moves, moves.length - 1);
}

const fs = require('fs');
const path = require('path');
const { Chess } = require('chess.js');

const inputDir = path.join(__dirname, '../../scratch_openings');
const outputFile = path.join(__dirname, '../data/openings.json');

const files = ['a.tsv', 'b.tsv', 'c.tsv', 'd.tsv', 'e.tsv'];
const openings = {};

function getBaseFen(fen) {
    return fen.split(' ').slice(0, 4).join(' ');
}

files.forEach(file => {
    const filePath = path.join(inputDir, file);
    if (!fs.existsSync(filePath)) {
        console.warn(`File not found: ${filePath}`);
        return;
    }
    
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');
    
    // Skip header line
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        const parts = line.split('\t');
        if (parts.length >= 3) {
            const eco = parts[0];
            const name = parts[1];
            const pgn = parts[2];
            
            try {
                const chess = new Chess();
                chess.loadPgn(pgn);
                const fen = chess.fen();
                const baseFen = getBaseFen(fen);
                
                // If a FEN is reached multiple times, we prefer the deeper sequence name?
                // Actually the TSV files are usually ordered such that deeper variations come later,
                // so simply overwriting will keep the most specific variation name.
                openings[baseFen] = { eco, name };
            } catch (err) {
                console.error(`Error parsing PGN in ${file} at line ${i + 1}: ${pgn}`);
            }
        }
    }
});

// Ensure the data directory exists
const dataDir = path.dirname(outputFile);
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

fs.writeFileSync(outputFile, JSON.stringify(openings, null, 2));
console.log(`Successfully compiled ${Object.keys(openings).length} openings to ${outputFile}`);

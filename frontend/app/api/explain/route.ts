import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function POST(req: Request) {
  try {
    const { fenBefore, playedMoveSan, bestMoveSan, evalCpAfter, cpLoss } = await req.json();

    const apiKey = process.env.GEMINI_API_KEY || '';
    if (!apiKey) {
      return NextResponse.json({ 
        explanation: 'AI explanations require a Gemini API key. Add GEMINI_API_KEY to your .env.local file.',
        arrow: []
      });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    const prompt = `A chess player made move ${playedMoveSan} in this position (FEN: ${fenBefore}). 
Stockfish says the best move was ${bestMoveSan} with an evaluation of +${(evalCpAfter / 100).toFixed(1)}. 
The played move caused a loss of ${cpLoss} centipawns. 
Explain why the engine move was better, in exactly 2 sentences for an intermediate player. 
Also provide the engine's best move as a from-to square pair (e.g. ['e2', 'e4']). 
Return ONLY valid JSON in this exact format: {"explanation": "...", "arrow": ["from", "to"]}`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    
    // Extract JSON block
    const match = text.match(/\{[\s\S]*\}/);
    if (match) {
      const parsed = JSON.parse(match[0]);
      return NextResponse.json(parsed);
    }
    
    return NextResponse.json({ explanation: text, arrow: [] });
  } catch (error: any) {
    console.error('Gemini error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

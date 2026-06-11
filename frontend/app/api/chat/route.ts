import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function POST(req: Request) {
  try {
    const { messages, fen, moveData } = await req.json();

    const apiKey = process.env.GEMINI_API_KEY || '';
    if (!apiKey) {
      return NextResponse.json({ error: 'Gemini API key not configured' }, { status: 500 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    let systemContext = `You are an expert Chess Coach named Tommy. You are analyzing a specific position with a student.
Current FEN: ${fen}
`;
    if (moveData) {
      systemContext += `\nThe student just played: ${moveData.move_san}. Stockfish evaluated this position at ${moveData.eval_after_cp / 100}. 
The best engine move was ${moveData.best_move_san}. The student's move was classified as a ${moveData.classification}.`;
    }

    systemContext += `\nKeep your answers concise, friendly, and highly educational. Focus on the tactical or strategic aspects.`;

    const formattedMessages = messages.map((m: any) => `${m.role === 'user' ? 'Student' : 'Tommy'}: ${m.content}`).join('\n');
    
    const prompt = `${systemContext}\n\nConversation history:\n${formattedMessages}\n\nTommy:`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    
    return NextResponse.json({ reply: text });
  } catch (error: any) {
    console.error('Chat API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

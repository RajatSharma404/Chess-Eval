import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function POST(req: Request) {
  try {
    const { message, pgn, history } = await req.json();

    const apiKey = process.env.GEMINI_API_KEY || '';
    if (!apiKey) {
      return NextResponse.json({ 
        response: 'Supercoach requires a Gemini API key. Add GEMINI_API_KEY to your .env.local file.',
      });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.0-flash',
      systemInstruction: 'You are Supercoach, an expert grandmaster chess coach. The user is showing you a specific chess game they played or are analyzing. Keep your responses concise, highly educational, and encouraging. Focus on tactical themes, strategic plans, and psychological aspects of chess. Do not output large blocks of text, use short paragraphs.'
    });

    const prompt = `Here is the PGN of the game we are discussing:\n${pgn}\n\nUser Question: ${message}`;
    
    // Convert history format if needed
    const formattedHistory = history ? history.map((msg: any) => ({
       role: msg.role === 'user' ? 'user' : 'model',
       parts: [{ text: msg.content }]
    })) : [];

    const chat = model.startChat({ history: formattedHistory });
    const result = await chat.sendMessage(prompt);
    const text = result.response.text();
    
    return NextResponse.json({ response: text });
  } catch (error: any) {
    console.error('Supercoach error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

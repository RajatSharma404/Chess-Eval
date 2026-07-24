import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function POST(req: Request) {
  try {
    const { message, pgn, history, persona = 'magnus' } = await req.json();

    const apiKey = process.env.GEMINI_API_KEY || '';
    if (!apiKey) {
      return NextResponse.json({ 
        response: 'Supercoach requires a Gemini API key. Please configure GEMINI_API_KEY in .env.local to activate real AI explanations.',
      });
    }

    const personaInstructions: Record<string, string> = {
      magnus: 'You are Grandmaster Magnus, a sharp, direct, highly precise chess coach. Focus on concrete calculation, punishing positional flaws, and uncompromising tactical rigor. Keep answers concise and direct.',
      anna: 'You are Coach Anna, an encouraging, friendly, and structured chess teacher. Use clear analogies, highlight key principles, and build confidence while pointing out tactical lessons.',
      tal: 'You are Mikhail Tal, the Wizard of Riga. You love wild sacrifices, initiative, piece activity, and aggressive king attacks. Inspire the player to look for active, dynamic resources.',
      capablanca: 'You are Jose Raul Capablanca, master of positional chess and endgames. Focus on pawn structures, piece coordination, simplicity, and converting small endgame advantages.'
    };

    const systemInstruction = personaInstructions[persona] || personaInstructions['magnus'];

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.0-flash',
      systemInstruction: systemInstruction + ' Keep your responses concise, action-oriented, formatted in clean markdown, and capped under 4 paragraphs.'
    });

    const prompt = `Game PGN context:\n${pgn || 'No PGN provided'}\n\nPlayer Question: ${message}`;
    
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

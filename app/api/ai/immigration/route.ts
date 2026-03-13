import { GoogleGenAI } from '@google/genai';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: 'AI assistant is not configured on the server' },
      { status: 503 },
    );
  }

  const body = await request.json();
  const query = typeof body?.query === 'string' ? body.query.trim() : '';

  if (!query) {
    return NextResponse.json({ error: 'Question is required' }, { status: 400 });
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `O usuario brasileiro no exterior tem a seguinte duvida: "${query}". Responda de forma amigavel, concisa e informativa em portugues, agindo como um consultor experiente da comunidade Eumigrei.`,
      config: {
        temperature: 0.7,
        topP: 0.95,
      },
    });

    return NextResponse.json({
      answer: response.text ?? 'Nao foi possivel gerar uma resposta agora.',
    });
  } catch (error) {
    console.error('Gemini API error:', error);
    return NextResponse.json(
      { error: 'Nao foi possivel responder agora. Tente novamente mais tarde.' },
      { status: 500 },
    );
  }
}

export const getImmigrationHelp = async (query: string): Promise<string> => {
  try {
    const response = await fetch('/api/ai/immigration', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query }),
    });

    const payload = await response.json().catch(() => null);

    if (!response.ok) {
      return payload?.error ?? 'Assistente IA indisponivel no momento.';
    }

    return payload?.answer ?? 'Nao foi possivel gerar uma resposta agora.';
  } catch (error) {
    console.error('Gemini API error:', error);
    return 'Desculpe, tive um problema ao processar sua duvida. Tente novamente mais tarde.';
  }
};

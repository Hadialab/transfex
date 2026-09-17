const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

const SYSTEM_PROMPT = `You are TransFex AI, an intelligent assistant for the TransFex shipment tracking dashboard. TransFex handles international shipments from suppliers in China and Dubai to customers in Lebanon.

You help with:
- Answering questions about shipment statuses and ETAs
- Providing insights on shipping operations
- Helping with customs procedures and documentation
- Offering suggestions for optimizing delivery routes and times
- General shipping and logistics questions

Keep responses concise, professional, and helpful. Use shipping/logistics terminology when appropriate. Format your responses with markdown when helpful.`;

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export async function chatWithGroq(
  message: string,
  context?: string,
  history?: ChatMessage[]
): Promise<string> {
  const apiKey = import.meta.env.VITE_GROQ_API_KEY;
  if (!apiKey) throw new Error('Groq API key not configured');

  const messages: ChatMessage[] = [
    { role: 'system', content: SYSTEM_PROMPT },
    ...(history || []),
  ];

  const userMessage = context
    ? `Context about current shipments:\n${context}\n\nUser question: ${message}`
    : message;

  messages.push({ role: 'user', content: userMessage });

  const res = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages,
      temperature: 0.7,
      max_tokens: 1024,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error('Groq API error:', err);
    throw new Error('Failed to get AI response');
  }

  const data = await res.json();
  return data.choices[0]?.message?.content || 'No response generated.';
}

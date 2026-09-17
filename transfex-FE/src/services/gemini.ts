import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GOOGLE_AI_API_KEY || '');

const SYSTEM_PROMPT = `You are TransFex AI, an intelligent assistant for the TransFex shipment tracking dashboard. TransFex handles international shipments from suppliers in China and Dubai to customers in Lebanon.

You help with:
- Answering questions about shipment statuses and ETAs
- Providing insights on shipping operations
- Helping with customs procedures and documentation
- Offering suggestions for optimizing delivery routes and times
- General shipping and logistics questions

Keep responses concise, professional, and helpful. Use shipping/logistics terminology when appropriate. If asked about specific orders, use the context provided.`;

export async function chatWithGemini(
  message: string,
  context?: string,
  history?: { role: string; text: string }[]
): Promise<string> {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    const chatHistory = history?.map((h) => ({
      role: h.role as 'user' | 'model',
      parts: [{ text: h.text }],
    })) || [];

    const chat = model.startChat({
      history: [
        { role: 'user', parts: [{ text: 'You are TransFex AI. Respond to all messages in this context.' }] },
        { role: 'model', parts: [{ text: SYSTEM_PROMPT }] },
        ...chatHistory,
      ],
    });

    const fullMessage = context
      ? `Context about current shipments:\n${context}\n\nUser question: ${message}`
      : message;

    const result = await chat.sendMessage(fullMessage);
    return result.response.text();
  } catch (error) {
    console.error('Gemini API error:', error);
    throw new Error('Failed to get AI response. Please check your API key.');
  }
}

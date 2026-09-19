import { ApiError } from '../../utils/ApiError';
import { env } from '../../config/env';
import { logger } from '../../config/logger';
import * as repo from './ai.repository';
import type { ChatInput } from './ai.schemas';
import type { ShipmentContext } from './ai.types';

const SYSTEM_PROMPT = `You are TransFex AI, an intelligent assistant for the TransFex shipment tracking dashboard. TransFex handles international shipments from suppliers in China and Dubai to customers in Lebanon.

You help with:
- Answering questions about shipment statuses and ETAs
- Providing insights on shipping operations
- Helping with customs procedures and documentation
- Offering suggestions for optimizing delivery routes and times
- General shipping and logistics questions

Keep responses concise, professional, and helpful. Use shipping/logistics terminology when appropriate. Format your responses with markdown when helpful.

When the user asks about current shipments, ground your answer in the context provided below. Do not invent shipment IDs or counts that aren't in the context.`;

function formatContext(ctx: ShipmentContext): string {
  const lines: string[] = [];

  lines.push(`Total shipments: ${ctx.totalShipments}`);

  const statusEntries = Object.entries(ctx.statusBreakdown);
  if (statusEntries.length > 0) {
    lines.push(
      `Status breakdown: ${statusEntries.map(([s, c]) => `${s}: ${c}`).join(', ')}`
    );
  }

  const originEntries = Object.entries(ctx.originBreakdown);
  if (originEntries.length > 0) {
    lines.push(
      `Origins: ${originEntries.map(([o, c]) => `${o}: ${c}`).join(', ')}`
    );
  }

  if (ctx.flagged.length > 0) {
    lines.push('', 'Flagged shipments:');
    for (const f of ctx.flagged) {
      lines.push(`- ${f.orderId}: ${f.customerName}${f.latestNote ? ` (${f.latestNote})` : ''}`);
    }
  }

  if (ctx.inCustoms.length > 0) {
    lines.push('', 'Shipments in customs:');
    for (const c of ctx.inCustoms) {
      lines.push(`- ${c.orderId}: ${c.customerName}, from ${c.origin}`);
    }
  }

  if (ctx.recentActivity.length > 0) {
    lines.push('', 'Recent activity:');
    for (const a of ctx.recentActivity) {
      lines.push(`- ${a.message}`);
    }
  }

  return lines.join('\n');
}

/**
 * Gemini's REST API uses `contents: [{role, parts: [{text}]}]` where role
 * is 'user' or 'model' (not 'assistant'). The system prompt goes in a
 * separate `systemInstruction` field rather than as a message. This helper
 * translates from our internal chat shape to that.
 */
function buildGeminiContents(
  input: ChatInput
): Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }> {
  const contents: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }> = [];

  if (input.history) {
    for (const h of input.history) {
      contents.push({
        role: h.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: h.content }],
      });
    }
  }

  contents.push({
    role: 'user',
    parts: [{ text: input.message }],
  });

  return contents;
}

export async function chat(userId: string, input: ChatInput): Promise<{ reply: string }> {
  // Server-side context - never trust the client's version of its own data.
  const context = await repo.buildContextForUser(userId);
  const contextBlock = formatContext(context);

  const systemInstruction = `${SYSTEM_PROMPT}\n\nContext about current shipments:\n${contextBlock}`;
const url = `https://generativelanguage.googleapis.com/v1beta/models/${env.GEMINI_MODEL}:generateContent?key=${env.GEMINI_API_KEY}`;
  let res: Response;
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemInstruction }] },
        contents: buildGeminiContents(input),
        generationConfig: {
          
          maxOutputTokens: 1024,
        },
      }),
    });
  } catch (err) {
    logger.error({ err }, 'Gemini request failed');
    throw ApiError.badRequest('AI provider is unreachable. Try again later.');
  }

  if (!res.ok) {
    // Log the provider's response so we can debug, but never leak it to the
    // client - it can contain quota info, model names, or account hints.
    const body = await res.text();
    logger.error({ status: res.status, body }, 'Gemini returned non-OK');
    throw ApiError.badRequest('AI provider returned an error. Try again later.');
  }

  const data = (await res.json()) as {
    candidates?: Array<{
      content?: { parts?: Array<{ text?: string }> };
      finishReason?: string;
    }>;
    promptFeedback?: { blockReason?: string };
  };

  // Safety filters can block a response before it's generated. Surfacing
  // this as a distinct message is more useful than "empty response".
  if (data.promptFeedback?.blockReason) {
    logger.warn({ reason: data.promptFeedback.blockReason }, 'Gemini blocked the prompt');
    throw ApiError.badRequest(
      'The assistant could not answer that question. Try rephrasing.'
    );
  }

  const reply = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
  if (!reply) {
    logger.error({ data }, 'Gemini response missing content');
    throw ApiError.badRequest('AI provider returned an empty response.');
  }

  return { reply };
}
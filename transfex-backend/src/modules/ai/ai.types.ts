export type ChatRole = 'user' | 'assistant';

export interface ChatMessage {
  role: ChatRole;
  content: string;
}

export interface ChatInput {
  message: string;
  history?: ChatMessage[];
}

/**
 * The structured context we hand to the model. Built server-side from the
 * caller's own data - never from anything the client claims about itself.
 * This is what makes the assistant actually useful instead of a plain proxy.
 */
export interface ShipmentContext {
  totalShipments: number;
  statusBreakdown: Record<string, number>;
  originBreakdown: Record<string, number>;
  flagged: Array<{ orderId: string; customerName: string; latestNote: string | null }>;
  inCustoms: Array<{ orderId: string; customerName: string; origin: string }>;
  recentActivity: Array<{ message: string; timestamp: string }>;
}

export interface ChatResult {
  reply: string;
}
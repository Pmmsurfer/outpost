export interface Message {
  id: string;
  conversationId: string;
  sender: "host" | "guest";
  body: string;
  sentAt: string;
}

export interface Conversation {
  id: string;
  guestName: string;
  guestEmail: string;
  retreatId: string;
  retreatName: string;
  lastMessage: string;
  lastAt: string;
  unread: boolean;
}

/** Use Supabase messages when available; no mock data. */
export const mockConversations: Conversation[] = [];
export const mockMessagesByConversation: Record<string, Message[]> = {};

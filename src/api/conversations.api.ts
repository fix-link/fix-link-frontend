import api, { parseError } from "./auth.api";

export interface Conversation {
  id: string;
  job?: string;
  job_id?: string;
  customer?: string;
  professional?: string;
  created_at?: string;
  updated_at?: string;
  last_message?: string;
  unread_count?: number;
}

export interface Message {
  id: string;
  sender: string;
  text?: string;
  body?: string;
  created_at: string;
  is_read: boolean;
  content?: string;
  is_me?: boolean;
}

/**
 * Get conversation by ID
 */
export const getConversationById = async (id: string): Promise<Conversation> => {
  try {
    const response = await api.get(`/conversations/${id}/`);
    return response.data;
  } catch (error: any) {
    console.error(`getConversationById: failed for ${id}`, error?.response?.data || error?.message || error);
    throw new Error(parseError(error));
  }
};

/**
 * Get or Create a conversation for a specific job/participant.
 * POST /api/conversations/
 */
export const getOrCreateConversation = async (participantId: string, jobId?: string): Promise<Conversation> => {
  try {
    const response = await api.post("/conversations/", { 
      participant_id: participantId, 
      job_id: jobId 
    });
    return response.data;
  } catch (error: any) {
    console.error("getOrCreateConversation: failed", error?.response?.data || error?.message || error);
    throw new Error(parseError(error));
  }
};

/**
 * List messages for a conversation
 * GET /api/conversations/{id}/messages/
 */
export const getMessages = async (conversationId: string): Promise<Message[]> => {
  try {
    const response = await api.get(`/conversations/${conversationId}/messages/`);
    return Array.isArray(response.data) ? response.data : [];
  } catch (error: any) {
    console.error(`getMessages: failed for ${conversationId}`, error?.response?.data || error?.message || error);
    throw new Error(parseError(error));
  }
};

/**
 * Send a message to a conversation
 * POST /api/conversations/{id}/messages/
 */
export const sendMessage = async (conversationId: string, text: string): Promise<Message> => {
  try {
    const response = await api.post(`/conversations/${conversationId}/messages/`, { body: text });
    return response.data;
  } catch (error: any) {
    console.error(`sendMessage: failed for ${conversationId}`, error?.response?.data || error?.message || error);
    throw new Error(parseError(error));
  }
};

/**
 * Mark all messages in a conversation as read
 * POST /api/conversations/{id}/mark-read/
 */
export const markAsRead = async (conversationId: string): Promise<void> => {
  try {
    await api.post(`/conversations/${conversationId}/mark-read/`);
  } catch (error: any) {
    console.error(`markAsRead: failed for ${conversationId}`, error?.response?.data || error?.message || error);
  }
};

/**
 * Get total unread message count
 * GET /api/conversations/unread-count/
 */
export const getUnreadCount = async (): Promise<number> => {
  try {
    const response = await api.get("/conversations/unread-count/");
    return response.data.count || 0;
  } catch (error: any) {
    console.error("getUnreadCount: failed", error?.response?.data || error?.message || error);
    return 0;
  }
};

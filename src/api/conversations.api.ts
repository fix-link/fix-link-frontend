import api, { parseError } from "./auth.api";

export interface Conversation {
  id: string;
  job?: string;
  job_id?: string;
  customer?: string;
  professional?: string;
  created_at?: string;
  updated_at?: string;
}

export const getConversationById = async (id: string): Promise<Conversation> => {
  try {
    const response = await api.get(`/conversations/${id}/`);
    return response.data;
  } catch (error: any) {
    console.error(`getConversationById: failed for ${id}`, error?.response?.data || error?.message || error);
    throw new Error(parseError(error));
  }
};

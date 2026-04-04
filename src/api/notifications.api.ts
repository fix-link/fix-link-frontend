import api, { parseError } from "./auth.api";

export interface Notification {
    id: string;
    message: string;
    type: string;
    is_read: boolean;
    created_at: string;
    message_id?: string;
    message_session_id?: string;
    link?: string;
    job_id?: string;       // job/request UUID for navigation
    conversation_id?: string; // reliable conversation ID for direct deep linking
    sender_name?: string;  // name of the person who triggered the notification
    title?: string;
    body?: string;
}

/**
 * Get all notifications for the current user
 * V2 Endpoint: GET /notifications/
 */
// Helper: try extract a UUID from a URL string
const extractIdFromLink = (link?: string): string | undefined => {
    if (!link) return undefined;
    const match = link.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i);
    return match ? match[0] : undefined;
};

export const getNotifications = async (): Promise<Notification[]> => {
    try {
        const response = await api.get("/notifications/");
        // Map backend fields to frontend-friendly names if needed
        return response.data.map((n: any) => ({
            id: n.id,
            message: n.body || n.message || n.text || n.title || "New update",
            title: n.title,
            body: n.body,
            type: n.notification_type || n.type || (n.channel === 'job_updates' ? 'job_request' : 'info'),
            is_read: n.is_read || n.status === 'read' || false,
            created_at: n.created_at || n.sent_at || n.timestamp,
            link: n.link || n.action_url || n.data?.link || n.data?.action_url || n.payload?.link || n.payload?.action_url,
            // Capture job/request ID for deep navigation
            job_id: n.job_id || n.job || n.jobId || n.request_id || n.requestId || n.data?.job_id || n.data?.job || n.data?.request_id || n.data?.requestId || n.payload?.job_id || n.payload?.job || n.payload?.request_id || n.payload?.requestId || extractIdFromLink(n.link || n.action_url || n.data?.link || n.data?.action_url || n.payload?.link || n.payload?.action_url),
            // Reliable conversation ID from the backend for direct deep linking
            conversation_id: n.conversation_id || n.conversationId || n.conversation || n.data?.conversation_id || n.data?.conversationId || n.data?.conversation || n.payload?.conversation_id || n.payload?.conversationId || n.payload?.conversation || undefined,
            message_session_id: n.message_session_id || n.messageSessionId || n.session_id || n.sessionId || n.data?.message_session_id || n.data?.messageSessionId || n.data?.session_id || n.data?.sessionId || n.payload?.message_session_id || n.payload?.messageSessionId || n.payload?.session_id || n.payload?.sessionId || undefined,
            message_id: n.message_id || n.messageId || n.data?.message_id || n.data?.messageId || n.payload?.message_id || n.payload?.messageId || undefined,
            sender_name: n.sender_name || n.sender?.first_name
                ? (n.sender_name || `${n.sender?.first_name || ''} ${n.sender?.last_name || ''}`.trim())
                : null,
        }));
    } catch (error: any) {
        console.warn("Notifications API skipped (endpoint may not exist):", error.message);
        return []; // Graceful fallback
    }
};

/**
 * Mark a notification as read
 * Confirmed endpoint: POST /notifications/{id}/mark_as_read/
 */
export const markNotificationAsRead = async (id: string) => {
    try {
        const response = await api.post(`/notifications/${id}/mark_as_read/`);
        return response.data;
    } catch (error: any) {
        // Don't throw — allow UI to still update locally even if backend call fails
        console.warn(`markNotificationAsRead: failed for ${id}`, error?.response?.status);
    }
};

/**
 * Mark all notifications as read
 * Confirmed endpoint: POST /notifications/mark_all_as_read/
 */
export const markAllAsRead = async () => {
    try {
        const response = await api.post("/notifications/mark_all_as_read/");
        return response.data;
    } catch (error: any) {
        throw new Error(parseError(error));
    }
};

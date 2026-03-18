import api, { parseError } from "./auth.api";

export interface Notification {
    id: string;
    message: string;
    type: string;
    is_read: boolean;
    created_at: string;
    link?: string;
}

/**
 * Get all notifications for the current user
 * V2 Endpoint: GET /notifications/
 */
export const getNotifications = async (): Promise<Notification[]> => {
    try {
        const response = await api.get("/notifications/");
        // Map backend fields to frontend-friendly names if needed
        return response.data.map((n: any) => ({
            id: n.id,
            message: n.message || n.text || "New Notification",
            type: n.notification_type || n.type || "info",
            is_read: n.is_read || false,
            created_at: n.created_at || n.timestamp,
            link: n.link || n.action_url
        }));
    } catch (error: any) {
        console.warn("Notifications API skipped (endpoint may not exist):", error.message);
        return []; // Graceful fallback
    }
};

/**
 * Mark a notification as read
 * V2 Endpoint: PATCH /notifications/{id}/ (is_read: true)
 */
export const markNotificationAsRead = async (id: string) => {
    try {
        const response = await api.patch(`/notifications/${id}/`, { is_read: true });
        return response.data;
    } catch (error: any) {
        throw new Error(parseError(error));
    }
};

/**
 * Mark all notifications as read
 * V2 Endpoint: POST /notifications/mark-all-read/
 */
export const markAllAsRead = async () => {
    try {
        const response = await api.post("/notifications/mark-all-read/");
        return response.data;
    } catch (error: any) {
        throw new Error(parseError(error));
    }
};

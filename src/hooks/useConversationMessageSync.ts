import { useEffect, useRef, type Dispatch, type SetStateAction } from "react";
import { getMessages, markAsRead } from "../api/conversations.api";
import { connectConversationSocket } from "../api/realtime";
import { areMessagesEqual } from "../utils/messages";

const POLL_MS = 20000;

/**
 * Fetches messages and keeps them updated via WebSocket (when available) + slower polling fallback.
 */
export function useConversationMessageSync(
  conversationId: string | null,
  setMessages: Dispatch<SetStateAction<any[]>>,
  shouldMarkRead: (list: any[]) => boolean
) {
  const shouldMarkReadRef = useRef(shouldMarkRead);
  shouldMarkReadRef.current = shouldMarkRead;

  useEffect(() => {
    if (!conversationId) return;

    const applyMessages = (list: any[]) => {
      setMessages((prev) => (areMessagesEqual(prev, list) ? prev : list));
      if (shouldMarkReadRef.current(list)) {
        markAsRead(conversationId).catch(() => {});
      }
    };

    const fetchMessages = async () => {
      try {
        const list = await getMessages(conversationId);
        applyMessages(Array.isArray(list) ? list : []);
      } catch (err) {
        if (import.meta.env.DEV) {
          console.error("Message sync error", err);
        }
      }
    };

    fetchMessages();

    const { close } = connectConversationSocket(conversationId, {
      onEvent: (ev) => {
        if (ev?.event_type === "message") {
          fetchMessages();
        }
      },
    });

    const interval = setInterval(fetchMessages, POLL_MS);
    return () => {
      clearInterval(interval);
      close();
    };
  }, [conversationId, setMessages]);
}

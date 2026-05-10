type WsCleanup = () => void;

const getWsBase = () => {
  const apiBase = (import.meta.env.VITE_API_URL || "https://fix-link-5332f899c079.herokuapp.com").replace(/\/$/, "");
  // http(s) -> ws(s)
  return apiBase.replace(/^http/i, (m: string) => (m.toLowerCase() === "https" ? "wss" : "ws"));
};

const getAccessToken = () => localStorage.getItem("access_token") || "";

export type NotificationWsEvent =
  | { event_type: "notification_sync"; unread_notifications: number }
  | { event_type: string; [k: string]: any };

export type MessageWsEvent =
  | { event_type: "message_ack"; client_id?: string | null; status: string; message_id: string; sent_at: string }
  | { event_type: "message"; id: string; conversation: string; sender: string; body: string; is_read: boolean; sent_at: string; read_at?: string | null }
  | { event_type: "typing" | "presence"; [k: string]: any }
  | { event_type: string; [k: string]: any };

export function connectNotificationsSocket(opts: {
  onEvent?: (ev: NotificationWsEvent) => void;
  onOpen?: () => void;
  onClose?: (ev: CloseEvent) => void;
  onError?: (ev: Event) => void;
}): WsCleanup {
  const token = getAccessToken();
  const ws = new WebSocket(`${getWsBase()}/ws/notifications/?token=${encodeURIComponent(token)}`);

  ws.onopen = () => opts.onOpen?.();
  ws.onerror = (e) => opts.onError?.(e);
  ws.onclose = (e) => opts.onClose?.(e);
  ws.onmessage = (m) => {
    try {
      const ev = JSON.parse(m.data);
      opts.onEvent?.(ev);
    } catch {
      // ignore non-json
    }
  };

  return () => {
    try {
      ws.close();
    } catch {
      // ignore
    }
  };
}

export function connectConversationSocket(
  conversationId: string,
  opts: {
    onEvent?: (ev: MessageWsEvent) => void;
    onOpen?: () => void;
    onClose?: (ev: CloseEvent) => void;
    onError?: (ev: Event) => void;
  }
): { send: (payload: any) => void; close: WsCleanup } {
  const token = getAccessToken();
  const ws = new WebSocket(`${getWsBase()}/ws/messages/${conversationId}/?token=${encodeURIComponent(token)}`);

  ws.onopen = () => opts.onOpen?.();
  ws.onerror = (e) => opts.onError?.(e);
  ws.onclose = (e) => opts.onClose?.(e);
  ws.onmessage = (m) => {
    try {
      const ev = JSON.parse(m.data);
      opts.onEvent?.(ev);
    } catch {
      // ignore
    }
  };

  return {
    send: (payload: any) => {
      if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(payload));
    },
    close: () => {
      try {
        ws.close();
      } catch {
        // ignore
      }
    },
  };
}


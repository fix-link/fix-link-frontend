export const areMessagesEqual = (prev: unknown[], next: unknown[]) => {
  if (prev.length !== next.length) return false;
  return prev.every((msg, idx) => {
    const nextMsg = next[idx] as Record<string, unknown> | undefined;
    const m = msg as Record<string, unknown>;
    return (
      nextMsg &&
      m.id === nextMsg.id &&
      m.updated_at === nextMsg.updated_at &&
      m.created_at === nextMsg.created_at
    );
  });
};

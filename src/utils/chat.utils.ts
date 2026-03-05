import { ChatMessage } from "@/services/tauri";

export function groupMessages(messages: ChatMessage[]): ChatMessage[][] {
  const groups: ChatMessage[][] = [];
  let current: ChatMessage[] = [];

  for (const msg of messages) {
    if (current.length === 0 || current[0].role === msg.role) {
      current.push(msg);
    } else {
      groups.push(current);
      current = [msg];
    }
  }
  if (current.length > 0) groups.push(current);
  return groups;
}

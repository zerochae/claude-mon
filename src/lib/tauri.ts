import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import type { SessionPhase } from "@/lib/phases";

export interface SessionState {
  session_id: string;
  cwd: string;
  project_name: string;
  phase: SessionPhase;
  tool_name: string | null;
  tool_input: string | null;
  tool_use_id: string | null;
  pid: number | null;
  color_index: number;
  last_activity: number;
}

export function getSessions(): Promise<SessionState[]> {
  return invoke<SessionState[]>("get_sessions");
}

export function approvePermission(
  sessionId: string,
  toolUseId: string,
): Promise<undefined> {
  return invoke<undefined>("approve_permission", { sessionId, toolUseId });
}

export function denyPermission(
  sessionId: string,
  toolUseId: string,
  reason?: string,
): Promise<undefined> {
  return invoke<undefined>("deny_permission", { sessionId, toolUseId, reason });
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "tool";
  content: string;
  tool_name?: string;
  tool_status?: string;
  timestamp: number;
}

export function getChatMessages(
  sessionId: string,
  cwd: string,
): Promise<ChatMessage[]> {
  return invoke<ChatMessage[]>("get_chat_messages", { sessionId, cwd });
}

export function setVibrancy(effect: string): Promise<undefined> {
  return invoke<undefined>("set_vibrancy", { effect });
}

export function listenSessionUpdate(
  callback: (sessions: SessionState[]) => void,
) {
  return listen<SessionState[]>("session-updated", (event) => {
    callback(event.payload);
  });
}

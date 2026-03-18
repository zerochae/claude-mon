import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import type { SessionPhase } from "@/constants/phases";

export interface SessionState {
  session_id: string;
  cwd: string;
  project_name: string;
  phase: SessionPhase;
  tool_name: string | null;
  tool_input: Record<string, unknown> | null;
  tool_use_id: string | null;
  pid: number | null;
  tty: string | null;
  subagent_count: number;
  color_index: number;
  last_activity: number;
  context_remaining_pct: number | null;
  context_used_tokens: number | null;
  context_max_tokens: number | null;
}

export function getSessions(): Promise<SessionState[]> {
  return invoke<SessionState[]>("get_sessions");
}

export function approvePermission(
  sessionId: string,
  toolUseId: string,
): Promise<boolean> {
  return invoke<boolean>("approve_permission", { sessionId, toolUseId });
}

export function denyPermission(
  sessionId: string,
  toolUseId: string,
  reason?: string,
): Promise<boolean> {
  return invoke<boolean>("deny_permission", { sessionId, toolUseId, reason });
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "tool";
  content: string;
  tool_name?: string;
  tool_status?: string;
  tool_output?: string;
  subagent_type?: string;
  subagent_prompt?: string;
  timestamp: number;
}

export function sendMessage(
  sessionId: string,
  message: string,
): Promise<boolean> {
  return invoke<boolean>("send_message", { sessionId, message });
}

export function getChatMessages(
  sessionId: string,
  cwd: string,
): Promise<ChatMessage[]> {
  return invoke<ChatMessage[]>("get_chat_messages", { sessionId, cwd });
}

export interface SessionStats {
  model: string | null;
  total_input_tokens: number;
  total_output_tokens: number;
  total_cache_read_tokens: number;
  total_cache_write_tokens: number;
  context_window: number;
  current_context_tokens: number;
  message_count: number;
}

export function getSessionStats(
  sessionId: string,
  cwd: string,
): Promise<SessionStats> {
  return invoke<SessionStats>("get_session_stats", { sessionId, cwd });
}

export interface UsageWindow {
  utilization: number | null;
  resetsAt: string | null;
}

export interface ExtraUsage {
  isEnabled: boolean | null;
  monthlyLimit: number | null;
  usedCredits: number | null;
  utilization: number | null;
  currency: string | null;
}

export interface ClaudeUsage {
  fiveHour: UsageWindow | null;
  sevenDay: UsageWindow | null;
  sevenDaySonnet: UsageWindow | null;
  sevenDayOpus: UsageWindow | null;
  extraUsage: ExtraUsage | null;
  subscriptionType: string | null;
  rateLimitTier: string | null;
}

export function getClaudeUsage(): Promise<ClaudeUsage> {
  return invoke<ClaudeUsage>("get_claude_usage");
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

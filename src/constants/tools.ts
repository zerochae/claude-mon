import { ui } from "@/constants/glyph";

export const TOOL_ICONS: Record<string, string> = {
  Bash: "",
  Read: "󰈙",
  Edit: "",
  Write: "",
  Glob: "󰱼",
  Grep: "󰥨",
  WebFetch: "󰖟",
  WebSearch: "󰖟",
  Agent: "󰚩",
  Task: "󰚩",
  NotebookEdit: "󰈙",
  Skill: "",
  AskUserQuestion: "󰋗",
  SendMessage: "󰍡",
};

export const TOOL_COLORS: Record<string, string> = {
  Bash: "var(--colors-yellow, #e5c07b)",
  Read: "var(--colors-blue, #61AFEF)",
  Edit: "var(--colors-green, #98c379)",
  Write: "var(--colors-green, #98c379)",
  Glob: "var(--colors-magenta, #C678DD)",
  Grep: "var(--colors-magenta, #C678DD)",
  WebFetch: "var(--colors-cyan, #56b6c2)",
  WebSearch: "var(--colors-cyan, #56b6c2)",
  Agent: "var(--colors-orange, #D19A66)",
  Task: "var(--colors-orange, #D19A66)",
};

export const HIDDEN_TOOLS = new Set([
  "ToolSearch",
  "TaskCreate",
  "TaskUpdate",
  "TaskGet",
  "TaskOutput",
  "TaskList",
  "TaskStop",
  "TeamCreate",
  "TeamDelete",
  "EnterPlanMode",
  "ExitPlanMode",
  "EnterWorktree",
  "ListMcpResourcesTool",
  "ReadMcpResourceTool",
]);

export function detectBashSubtype(content: string): string | null {
  const m = /```bash\n\s*(git|gh)\s/.exec(content);
  if (m) return m[1];
  const inline = /^`(git|gh)\s/.exec(content);
  if (inline) return inline[1];
  return null;
}

const BASH_SUBTYPE_ICONS: Record<string, string> = {
  git: ui.git,
  gh: ui.github,
};

const BASH_SUBTYPE_COLORS: Record<string, string> = {
  git: "var(--colors-orange, #D19A66)",
  gh: "var(--colors-blue, #61AFEF)",
};

export function getToolIcon(toolName: string | null, content?: string): string {
  if (!toolName) return "󰋗";
  if (toolName === "Bash" && content) {
    const sub = detectBashSubtype(content);
    if (sub && BASH_SUBTYPE_ICONS[sub]) return BASH_SUBTYPE_ICONS[sub];
  }
  if (toolName.startsWith("mcp__")) return "󱂛";
  return TOOL_ICONS[toolName] ?? "󰋗";
}

export function getToolColor(
  toolName: string | null,
  content?: string,
): string {
  if (!toolName) return "var(--colors-comment, #565c64)";
  if (toolName === "Bash" && content) {
    const sub = detectBashSubtype(content);
    if (sub && BASH_SUBTYPE_COLORS[sub]) return BASH_SUBTYPE_COLORS[sub];
  }
  if (toolName.startsWith("mcp__")) return "var(--colors-cyan, #56b6c2)";
  return TOOL_COLORS[toolName] ?? "var(--colors-comment, #565c64)";
}

export function getToolLabel(
  toolName: string | null,
  content?: string,
): string {
  if (toolName === "Bash" && content) {
    const sub = detectBashSubtype(content);
    if (sub === "git") return "git";
    if (sub === "gh") return "gh";
  }
  return toolName ?? "Unknown";
}

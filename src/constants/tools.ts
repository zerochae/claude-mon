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

export function getToolIcon(toolName: string | null): string {
  if (!toolName) return "󰋗";
  if (toolName.startsWith("mcp__")) return "󱂛";
  return TOOL_ICONS[toolName] ?? "󰋗";
}

export function getToolColor(toolName: string | null): string {
  if (!toolName) return "var(--colors-comment, #565c64)";
  if (toolName.startsWith("mcp__")) return "var(--colors-cyan, #56b6c2)";
  return TOOL_COLORS[toolName] ?? "var(--colors-comment, #565c64)";
}

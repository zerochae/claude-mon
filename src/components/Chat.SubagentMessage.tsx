import { useState } from "react";

import { Button } from "@/components/Button";
import { Clawd } from "@/components/Clawd";
import { Markdown } from "@/components/Markdown";
import { COLOR_COUNT, getClawdColor } from "@/constants/colors";
import { ChatMessage } from "@/services/tauri";
import {
  subagentBubble,
  subagentClickable,
  subagentName,
  subagentPromptWrap,
  subagentWrap,
} from "@/styles/Chat.styles";

interface SubagentMessageProps {
  message: ChatMessage;
  index: number;
  sessionColorIndex: number;
}

export function SubagentMessage({
  message,
  index,
  sessionColorIndex,
}: SubagentMessageProps) {
  const [showPrompt, setShowPrompt] = useState(false);
  const agentType = message.subagent_type ?? "";
  const shortName = agentType.includes(":")
    ? (agentType.split(":").pop() ?? agentType)
    : agentType;
  const isDone = message.tool_status === "done";
  const miniPhases = ["processing", "compacting", "idle"] as const;
  const phase = isDone ? miniPhases[index % miniPhases.length] : "processing";

  return (
    <div className={subagentWrap}>
      <Button
        onClick={() => message.subagent_prompt && setShowPrompt(!showPrompt)}
        className={subagentClickable}
      >
        <Clawd
          color={getClawdColor((sessionColorIndex + index + 3) % COLOR_COUNT)}
          phase={phase}
          size={16}
        />
        <div className={subagentBubble}>
          <span className={subagentName}>
            {shortName || "agent"}
            {message.content && `: ${message.content}`}
          </span>
        </div>
      </Button>
      {showPrompt && message.subagent_prompt && (
        <div className={subagentPromptWrap}>
          <Markdown content={`\`\`\`\n${message.subagent_prompt}\n\`\`\``} />
        </div>
      )}
    </div>
  );
}

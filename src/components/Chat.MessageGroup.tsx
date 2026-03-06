import { ChatMessage } from "@/services/tauri";
import { UserMessage } from "@/components/Chat.UserMessage";
import { AssistantMessage } from "@/components/Chat.AssistantMessage";
import { SubagentMessage } from "@/components/Chat.SubagentMessage";
import { ToolMessage } from "@/components/Chat.ToolMessage";
import { HIDDEN_TOOLS } from "@/constants/tools";
import { messageGroup } from "@/styles/Chat.styles";

interface MessageGroupProps {
  messages: ChatMessage[];
  sessionColorIndex: number;
}

export function MessageGroup({
  messages,
  sessionColorIndex,
}: MessageGroupProps) {
  const role = messages[0].role;
  return (
    <div className={messageGroup({ role })}>
      {messages.map((msg, i) => {
        switch (msg.role) {
          case "user":
            return <UserMessage key={msg.id} message={msg} />;
          case "assistant":
            return <AssistantMessage key={msg.id} message={msg} />;
          case "tool":
            if (msg.subagent_type) {
              return (
                <SubagentMessage
                  key={msg.id}
                  message={msg}
                  index={i}
                  sessionColorIndex={sessionColorIndex}
                />
              );
            }
            if (msg.tool_name && HIDDEN_TOOLS.has(msg.tool_name)) return null;
            return <ToolMessage key={msg.id} message={msg} />;
        }
      })}
    </div>
  );
}

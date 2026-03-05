import { Markdown } from "@/components/Markdown";
import { ChatMessage } from "@/services/tauri";
import { assistantWrap } from "@/styles/Chat.styles";

export function AssistantMessage({ message }: { message: ChatMessage }) {
  return (
    <div className={assistantWrap}>
      <Markdown content={message.content} />
    </div>
  );
}

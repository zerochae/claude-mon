import { Markdown } from "@/components/Markdown";
import { ChatMessage } from "@/services/tauri";
import { userBubble, userBubbleWrap } from "@/styles/Chat.styles";

export function UserMessage({ message }: { message: ChatMessage }) {
  const isPending = message.id.startsWith("pending-");
  return (
    <div className={userBubbleWrap}>
      <div
        className={userBubble}
        style={isPending ? { opacity: 0.5 } : undefined}
      >
        <Markdown content={message.content} />
      </div>
    </div>
  );
}

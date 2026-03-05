import { Markdown } from "@/components/Markdown";
import { ChatMessage } from "@/services/tauri";
import { userBubbleWrap, userBubble } from "@/styles/Chat.styles";

export function UserMessage({ message }: { message: ChatMessage }) {
  return (
    <div className={userBubbleWrap}>
      <div className={userBubble}>
        <Markdown content={message.content} />
      </div>
    </div>
  );
}

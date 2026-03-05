import { ProcessingSpinner } from "@/components/Spinners";
import { thinkingWrap } from "@/styles/Chat.styles";

export function ThinkingIndicator() {
  return (
    <div className={thinkingWrap}>
      <ProcessingSpinner />
    </div>
  );
}

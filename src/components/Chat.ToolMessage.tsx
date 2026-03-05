import { useState } from "react";
import { ui } from "@/constants/glyph";
import { Markdown } from "@/components/Markdown";
import { Glyph } from "@/components/Glyph";
import { ChatMessage } from "@/services/tauri";
import { Button } from "@/components/Button";
import {
  toolWrap,
  toolButton,
  svgFlexShrink,
  chevron,
  toolExpanded,
} from "@/styles/Chat.styles";

export function ToolMessage({ message }: { message: ChatMessage }) {
  const [expanded, setExpanded] = useState(true);
  const isRunning = message.tool_status === "running";
  const isError = message.tool_status === "error";

  return (
    <div className={toolWrap}>
      <Button onClick={() => setExpanded(!expanded)} className={toolButton}>
        {isRunning ? (
          <svg
            width="12"
            height="12"
            viewBox="0 0 12 12"
            fill="none"
            className={svgFlexShrink}
          >
            <circle
              cx="6"
              cy="6"
              r="3"
              stroke="var(--colors-yellow, #e5c07b)"
              strokeWidth="1.5"
              strokeDasharray="4 3"
              fill="none"
            >
              <animateTransform
                attributeName="transform"
                type="rotate"
                from="0 6 6"
                to="360 6 6"
                dur="1s"
                repeatCount="indefinite"
              />
            </circle>
          </svg>
        ) : isError ? (
          <svg
            width="12"
            height="12"
            viewBox="0 0 12 12"
            fill="none"
            className={svgFlexShrink}
          >
            <circle
              cx="6"
              cy="6"
              r="3.5"
              fill="var(--colors-red, #E06C75)"
              opacity="0.8"
            />
          </svg>
        ) : (
          <Glyph size={10} color="var(--colors-green, #98c379)">
            {ui.oct_square_fill}
          </Glyph>
        )}
        <span>{message.tool_name}</span>
        <svg
          width="8"
          height="8"
          viewBox="0 0 8 8"
          fill="currentColor"
          className={chevron({ expanded })}
        >
          <path
            d="M2.5 1L6 4L2.5 7"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.2"
            strokeLinecap="round"
          />
        </svg>
      </Button>
      {expanded && (
        <div className={toolExpanded}>
          <Markdown content={message.content} />
        </div>
      )}
    </div>
  );
}

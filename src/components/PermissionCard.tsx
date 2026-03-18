import { memo } from "react";

import { Button } from "@/components/Button";
import { Clawd } from "@/components/Clawd";
import { Glyph } from "@/components/Glyph";
import { DiffBlock } from "@/components/Markdown.DiffBlock";
import { ShikiBlock } from "@/components/Markdown.ShikiBlock";
import { getClawdColor } from "@/constants/colors";
import { extensions as extGlyphs } from "@/constants/glyph";
import { getToolColor, getToolIcon, parseMcpToolName } from "@/constants/tools";
import {
  actions,
  badge,
  card,
  header,
  summaryBox,
  toolLabel,
} from "@/styles/PermissionCard.styles";
import { extractSummary, getDisplayPath } from "@/utils/permission.utils";

interface PermissionCardProps {
  toolName: string | null;
  toolInput: Record<string, unknown> | null;
  projectName?: string;
  cwd?: string;
  colorIndex?: number;
  phase?: string;
  hideIdentity?: boolean;
  onAllow: () => void;
  onDeny: () => void;
}

export const PermissionCard = memo(function PermissionCard({
  toolName,
  toolInput,
  projectName,
  cwd,
  colorIndex = 0,
  phase = "idle",
  hideIdentity = false,
  onAllow,
  onDeny,
}: PermissionCardProps) {
  const icon = getToolIcon(toolName);
  const iconColor = getToolColor(toolName);
  const summary = extractSummary(toolName, toolInput);
  const description = toolInput?.description as string | undefined;
  const filePath = toolInput?.file_path as string | undefined;
  const displayPath = getDisplayPath(filePath, cwd);

  return (
    <div className={card}>
      {!hideIdentity && (
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <Clawd color={getClawdColor(colorIndex)} phase={phase} size={16} />
          {projectName && (
            <span
              style={{
                fontSize: "10px",
                color: "var(--colors-text-muted)",
                fontWeight: 500,
              }}
            >
              {projectName}
            </span>
          )}
        </div>
      )}
      <div className={header}>
        <Glyph size={13} color={iconColor}>
          {icon}
        </Glyph>
        <span className={toolLabel}>
          {toolName ? parseMcpToolName(toolName) : "Unknown"}
        </span>
        <span className={badge}>PERMISSION</span>
        {filePath && displayPath && (
          <span
            style={{
              marginLeft: "auto",
              display: "flex",
              alignItems: "center",
              gap: "3px",
              fontSize: "10px",
              fontWeight: 400,
              overflow: "hidden",
              minWidth: 0,
            }}
          >
            <Glyph
              size={10}
              color={
                (
                  extGlyphs[
                    filePath.split(".").pop() as keyof typeof extGlyphs
                  ] as { color: string } | undefined
                )?.color ?? "var(--colors-text-muted)"
              }
            >
              {(
                extGlyphs[
                  filePath.split(".").pop() as keyof typeof extGlyphs
                ] as { icon: string } | undefined
              )?.icon ?? "\uf15b"}
            </Glyph>
            <span
              style={{
                lineHeight: 1,
                color: "var(--colors-text-muted)",
                whiteSpace: "nowrap",
              }}
            >
              {displayPath}
            </span>
          </span>
        )}
      </div>

      {description && (
        <span
          style={{
            fontSize: "10px",
            color: "var(--colors-text-muted)",
            lineHeight: 1.4,
          }}
        >
          {description}
        </span>
      )}

      {summary && (
        <div className={summaryBox}>
          {summary.diff ? (
            <DiffBlock code={summary.code} lang={summary.lang} />
          ) : (
            <ShikiBlock code={summary.code} lang={summary.lang} />
          )}
        </div>
      )}

      <div className={actions}>
        <Button
          variant="outline"
          size="sm"
          onClick={onDeny}
          style={{ flex: 1 }}
        >
          Deny
        </Button>
        <Button
          variant="solid"
          size="sm"
          color="success"
          onClick={onAllow}
          style={{ flex: 1 }}
        >
          Allow
        </Button>
      </div>
    </div>
  );
});

import { css } from "@styled-system/css";
import { Button } from "@/components/Button";

interface PermissionActionsProps {
  onAllow: () => void;
  onDeny: () => void;
}

const container = css({
  display: "flex",
  gap: "8px",
  w: "100%",
});

export function PermissionActions({ onAllow, onDeny }: PermissionActionsProps) {
  return (
    <div className={container}>
      <Button
        variant="outline"
        size="md"
        onClick={onDeny}
        style={{ flex: 1 }}
      >
        Deny
      </Button>
      <Button
        variant="solid"
        size="md"
        color="success"
        onClick={onAllow}
        style={{ flex: 1 }}
      >
        Allow
      </Button>
    </div>
  );
}

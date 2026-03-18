import { useEffect, useRef } from "react";

import { type DockPosition, type WindowAnchor } from "@/hooks/useSettings";
import {
  type MonitorBounds,
  resizeAnchored,
  watchDisplayChange,
} from "@/utils/windowManager";

interface DisplayWatchConfig {
  width: number;
  height: number;
  anchor: WindowAnchor;
  dock: DockPosition;
  dockMargin: number;
  enabled: boolean;
}

export function useDisplayWatch(config: DisplayWatchConfig) {
  const configRef = useRef(config);
  useEffect(() => {
    configRef.current = config;
  });

  useEffect(() => {
    if (!config.enabled) return;

    const cleanup = watchDisplayChange((_bounds: MonitorBounds) => {
      const c = configRef.current;
      resizeAnchored(c.width, c.height, c.anchor, c.dock, c.dockMargin).catch(
        () => undefined,
      );
    });

    return cleanup;
  }, [config.enabled]);
}

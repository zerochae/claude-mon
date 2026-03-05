import {
  getCurrentWindow,
  LogicalSize,
  PhysicalPosition,
  currentMonitor,
} from "@tauri-apps/api/window";
import { type WindowAnchor, type DockPosition } from "@/hooks/useSettings";

export async function getScreenBounds() {
  const monitor = await currentMonitor();
  if (!monitor) return null;
  return {
    x: monitor.position.x,
    y: monitor.position.y,
    w: monitor.size.width,
    h: monitor.size.height,
  };
}

export function clampToScreen(
  x: number,
  y: number,
  w: number,
  h: number,
  screen: { x: number; y: number; w: number; h: number },
) {
  const cx = Math.max(screen.x, Math.min(x, screen.x + screen.w - w));
  const cy = Math.max(screen.y, Math.min(y, screen.y + screen.h - h));
  return { x: cx, y: cy };
}

export async function resizeAnchored(
  newWidth: number,
  newHeight: number,
  anchor: WindowAnchor,
  dock: DockPosition,
  dockMargin: number,
) {
  const win = getCurrentWindow();
  const scale = await win.scaleFactor();
  const pos = await win.outerPosition();
  const size = await win.outerSize();
  const screen = await getScreenBounds();
  const newPhysW = Math.round(newWidth * scale);
  const newPhysH = Math.round(newHeight * scale);
  const physMargin = Math.round(dockMargin * scale);

  let nx: number, ny: number;
  if (dock !== "none" && screen) {
    nx = screen.x + Math.round((screen.w - newPhysW) / 2);
    ny =
      dock === "top"
        ? screen.y + physMargin
        : screen.y + screen.h - newPhysH - physMargin;
  } else {
    const dx = Math.round((size.width - newPhysW) / 2);
    let dy = 0;
    if (anchor === "center") dy = Math.round((size.height - newPhysH) / 2);
    else if (anchor === "bottom") dy = size.height - newPhysH;
    nx = pos.x + dx;
    ny = pos.y + dy;
    if (screen) {
      const clamped = clampToScreen(nx, ny, newPhysW, newPhysH, screen);
      nx = clamped.x;
      ny = clamped.y;
    }
  }
  await win.setPosition(new PhysicalPosition(nx, ny));
  await win.setSize(new LogicalSize(newWidth, newHeight));
}

export function easeOutCubic(t: number) {
  return 1 - (1 - t) ** 3;
}

export async function animateWindowSize(
  fromW: number,
  toW: number,
  fromH: number,
  toH: number,
  anchor: WindowAnchor,
  dock: DockPosition,
  dockMargin: number,
  duration: number,
  onDone?: () => void,
) {
  const win = getCurrentWindow();
  const scale = await win.scaleFactor();
  const startPos = await win.outerPosition();
  const screen = await getScreenBounds();
  const physFromW = Math.round(fromW * scale);
  const physFromH = Math.round(fromH * scale);
  const physMargin = Math.round(dockMargin * scale);
  const start = performance.now();

  function step(now: number) {
    const t = Math.min(1, (now - start) / duration);
    const e = easeOutCubic(t);
    const w = Math.round(fromW + (toW - fromW) * e);
    const h = Math.round(fromH + (toH - fromH) * e);
    const physW = Math.round(w * scale);
    const physH = Math.round(h * scale);

    let nx: number, ny: number;
    if (dock !== "none" && screen) {
      nx = screen.x + Math.round((screen.w - physW) / 2);
      ny =
        dock === "top"
          ? screen.y + physMargin
          : screen.y + screen.h - physH - physMargin;
    } else {
      const dx = Math.round((physFromW - physW) / 2);
      let dy = 0;
      if (anchor === "center") dy = Math.round((physFromH - physH) / 2);
      else if (anchor === "bottom") dy = physFromH - physH;
      nx = startPos.x + dx;
      ny = startPos.y + dy;
      if (screen) {
        const clamped = clampToScreen(nx, ny, physW, physH, screen);
        nx = clamped.x;
        ny = clamped.y;
      }
    }
    win.setPosition(new PhysicalPosition(nx, ny)).catch(() => undefined);
    win.setSize(new LogicalSize(w, h)).catch(() => undefined);
    if (t < 1) {
      requestAnimationFrame(step);
    } else {
      onDone?.();
    }
  }
  requestAnimationFrame(step);
}

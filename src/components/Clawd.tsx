import { css } from "@styled-system/css";
import { useEffect, useRef } from "react";

import { LEG_OFFSETS, VIEWBOX_H, VIEWBOX_W } from "@/constants/clawd";
import { BAR_STALE_SEC } from "@/constants/phases";

interface ClawdCanvasProps {
  color: string;
  phase: string;
  size?: number;
  lastActivity?: number;
  onClick?: () => void;
}

const canvasStyle = css({ imageRendering: "pixelated" });

export function Clawd({
  color,
  phase,
  size = 64,
  lastActivity,
  onClick,
}: ClawdCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef<number>(0);
  const legPhaseRef = useRef(0);
  const lastLegTickRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    const scale = size / VIEWBOX_H;
    const xOff = (w - VIEWBOX_W * scale) / 2;

    if (lastLegTickRef.current === 0) {
      lastLegTickRef.current = Date.now();
    }

    const isAnimating = phase === "processing" || phase === "compacting";
    const isResting = phase === "idle" || phase === "waiting_for_input";
    const animSpeed = phase === "compacting" ? 250 : 150;
    const needsLoop = isAnimating || isResting;

    function rect(x: number, y: number, rw: number, rh: number) {
      ctx?.fillRect(xOff + x * scale, y * scale, rw * scale, rh * scale);
    }

    function draw() {
      if (!ctx) return;
      const now = Date.now();
      const animEnabled =
        getComputedStyle(document.documentElement)
          .getPropertyValue("--clawd-animate")
          .trim() !== "0";

      if (
        isAnimating &&
        animEnabled &&
        now - lastLegTickRef.current >= animSpeed
      ) {
        legPhaseRef.current = (legPhaseRef.current + 1) % 4;
        lastLegTickRef.current = now;
      }

      ctx.clearRect(0, 0, w, h);

      const alpha = phase === "ended" ? 0.3 : 1.0;
      ctx.globalAlpha = alpha;

      let squish = 0;
      if (isResting && animEnabled) {
        const t = (now % 2500) / 2500;
        squish = Math.sin(t * Math.PI * 2) * 5;
      }

      const sx = squish * -0.4;

      ctx.fillStyle = color;
      rect(0 - sx, 13 - squish, 6, 13 + squish);
      rect(60 + sx, 13 - squish, 6, 13 + squish);

      const legXs = [6, 18, 42, 54];
      const baseLegH = 13;
      const offsets = isAnimating
        ? LEG_OFFSETS[legPhaseRef.current]
        : [0, 0, 0, 0];

      ctx.fillStyle = color;
      for (let i = 0; i < 4; i++) {
        rect(legXs[i], 39, 6, baseLegH + offsets[i]);
      }

      ctx.fillStyle = color;
      rect(6 - sx, 0 - squish * 0.4, 54 + sx * 2, 39 + squish * 0.4);

      const isSleeping =
        lastActivity === undefined
          ? phase === "idle"
          : phase === "waiting_for_input" &&
            Math.floor(Date.now() / 1000) - lastActivity >= BAR_STALE_SEC;
      const eyeH = isSleeping ? 2.5 : 6.5;
      const eyeY = isSleeping ? 13 + (6.5 - eyeH) : 13;
      ctx.fillStyle = "#000";
      rect(12, eyeY - squish * 0.15, 6, eyeH);
      rect(48, eyeY - squish * 0.15, 6, eyeH);
      ctx.globalAlpha = 1;

      if (needsLoop) {
        frameRef.current = requestAnimationFrame(draw);
      }
    }

    draw();

    if (!needsLoop) return;

    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, [color, phase, size, lastActivity]);

  const canvasW = Math.ceil(size * (VIEWBOX_W / VIEWBOX_H));
  const canvasH = size;

  return (
    <canvas
      ref={canvasRef}
      width={canvasW}
      height={canvasH}
      onClick={onClick}
      className={canvasStyle}
      style={{
        width: canvasW,
        height: canvasH,
        cursor: onClick ? "pointer" : "default",
      }}
    />
  );
}

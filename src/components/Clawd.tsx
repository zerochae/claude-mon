import { useRef, useEffect } from "react";
import { css } from "@styled-system/css";

interface ClawdCanvasProps {
  color: string;
  phase: string;
  size?: number;
  onClick?: () => void;
}

const VIEWBOX_W = 66;
const VIEWBOX_H = 52;

const LEG_OFFSETS = [
  [3, -3, 3, -3],
  [0, 0, 0, 0],
  [-3, 3, -3, 3],
  [0, 0, 0, 0],
];

const canvasStyle = css({ imageRendering: "pixelated" });

export function Clawd({
  color,
  phase,
  size = 64,
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
    const animSpeed = phase === "compacting" ? 250 : 150;

    function rect(x: number, y: number, rw: number, rh: number) {
      ctx?.fillRect(xOff + x * scale, y * scale, rw * scale, rh * scale);
    }

    function draw() {
      if (!ctx) return;
      const now = Date.now();

      if (isAnimating && now - lastLegTickRef.current >= animSpeed) {
        legPhaseRef.current = (legPhaseRef.current + 1) % 4;
        lastLegTickRef.current = now;
      }

      ctx.clearRect(0, 0, w, h);

      const alpha = phase === "ended" ? 0.3 : 1.0;
      ctx.globalAlpha = alpha;

      ctx.fillStyle = color;
      rect(0, 13, 6, 13);
      rect(60, 13, 6, 13);

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
      rect(6, 0, 54, 39);

      const eyeH = phase === "idle" ? 2.5 : 6.5;
      const eyeY = phase === "idle" ? 13 + (6.5 - eyeH) : 13;
      ctx.fillStyle = "#000";
      rect(12, eyeY, 6, eyeH);
      rect(48, eyeY, 6, eyeH);

      ctx.globalAlpha = 1;

      frameRef.current = requestAnimationFrame(draw);
    }

    draw();

    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, [color, phase, size]);

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

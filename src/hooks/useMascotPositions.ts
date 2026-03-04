import { useState, useEffect, useRef, type RefObject } from "react";
import { type SessionState } from "@/lib/tauri";
import {
  MASCOT_SIZE,
  LABEL_HEIGHT,
  SLOT_W,
  PAD_X,
  PAD_Y_TOP,
  PAD_Y_BOTTOM,
  WANDER_INTERVAL,
} from "@/components/HouseView.styles";
import {
  type MascotPos,
  getMoveParams,
  hasCollision,
  resolveOverlaps2D,
} from "@/components/HouseView.utils";

export function useMascotPositions(
  sessions: SessionState[],
  containerRef: RefObject<HTMLDivElement | null>,
): Record<string, MascotPos> {
  const [positions, setPositions] = useState<Record<string, MascotPos>>({});
  const lastSizeRef = useRef({ w: 0, h: 0 });

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      const { width: w, height: h } = entry.contentRect;
      const prev = lastSizeRef.current;
      if (prev.h > 0 && h > prev.h * 1.5) {
        setPositions((old) => {
          const next: Record<string, MascotPos> = {};
          for (const [id, pos] of Object.entries(old)) {
            let candidate: MascotPos;
            let attempts = 0;
            do {
              candidate = {
                x: PAD_X + Math.random() * Math.max(0, w - SLOT_W - PAD_X * 2),
                y:
                  PAD_Y_TOP +
                  Math.random() *
                    Math.max(
                      0,
                      h - MASCOT_SIZE - LABEL_HEIGHT - PAD_Y_TOP - PAD_Y_BOTTOM,
                    ),
                facingRight: pos.facingRight,
              };
              attempts++;
            } while (hasCollision(id, candidate, next) && attempts < 20);
            next[id] = candidate;
          }
          return next;
        });
      }
      lastSizeRef.current = { w, h };
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [containerRef]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const w = el.clientWidth;
    const h = el.clientHeight;

    setPositions((prev) => {
      const next = { ...prev };
      let dirty = false;

      const newIds: string[] = [];
      for (const s of sessions) {
        if (!Object.prototype.hasOwnProperty.call(next, s.session_id)) {
          const edge = Math.floor(Math.random() * 4);
          const midX = w / 2;
          const midY = h / 2;
          let ex: number, ey: number, facing: boolean;
          switch (edge) {
            case 0:
              ex = -MASCOT_SIZE;
              ey = midY;
              facing = true;
              break;
            case 1:
              ex = w + MASCOT_SIZE;
              ey = midY;
              facing = false;
              break;
            case 2:
              ex = midX;
              ey = -MASCOT_SIZE;
              facing = Math.random() > 0.5;
              break;
            default:
              ex = midX;
              ey = h + MASCOT_SIZE;
              facing = Math.random() > 0.5;
              break;
          }
          next[s.session_id] = { x: ex, y: ey, facingRight: facing };
          newIds.push(s.session_id);
          dirty = true;
        }
      }

      if (newIds.length > 0) {
        setTimeout(() => {
          const el2 = containerRef.current;
          if (!el2) return;
          const fw = el2.clientWidth;
          const fh = el2.clientHeight;
          setPositions((prev) => {
            const updated = { ...prev };
            for (const id of newIds) {
              if (!(id in updated)) continue;
              let candidate: MascotPos;
              let attempts = 0;
              do {
                candidate = {
                  x:
                    PAD_X +
                    Math.random() * Math.max(0, fw - SLOT_W - PAD_X * 2),
                  y:
                    PAD_Y_TOP +
                    Math.random() *
                      Math.max(
                        0,
                        fh -
                          MASCOT_SIZE -
                          LABEL_HEIGHT -
                          PAD_Y_TOP -
                          PAD_Y_BOTTOM,
                      ),
                  facingRight: updated[id].facingRight,
                };
                attempts++;
              } while (hasCollision(id, candidate, updated) && attempts < 20);
              updated[id] = candidate;
            }
            return updated;
          });
        }, 300);
      }

      const ids = new Set(sessions.map((s) => s.session_id));
      for (const id of Object.keys(next)) {
        if (!ids.has(id)) {
          Reflect.deleteProperty(next, id);
          dirty = true;
        }
      }

      return dirty ? next : prev;
    });
  }, [sessions, containerRef]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const timer = setInterval(() => {
      const w = el.clientWidth;
      const h = el.clientHeight;

      setPositions((prev) => {
        const next = { ...prev };
        let dirty = false;

        for (const s of sessions) {
          const pos = next[s.session_id];
          if (!Object.prototype.hasOwnProperty.call(next, s.session_id))
            continue;
          const { chance, range } = getMoveParams(s.phase);
          if (range === 0 || Math.random() > chance) continue;

          const dx = (Math.random() - 0.5) * range * 2;
          const dy = (Math.random() - 0.5) * range * 2;
          const nx = Math.max(PAD_X, Math.min(w - SLOT_W - PAD_X, pos.x + dx));
          const ny = Math.max(
            PAD_Y_TOP,
            Math.min(h - MASCOT_SIZE - LABEL_HEIGHT - PAD_Y_BOTTOM, pos.y + dy),
          );
          const candidate = {
            x: nx,
            y: ny,
            facingRight: dx !== 0 ? dx > 0 : pos.facingRight,
          };

          if (!hasCollision(s.session_id, candidate, next)) {
            next[s.session_id] = candidate;
            dirty = true;
          }
        }

        return dirty ? next : prev;
      });
    }, WANDER_INTERVAL);

    return () => clearInterval(timer);
  }, [sessions, containerRef]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const timer = setInterval(() => {
      const w = el.clientWidth;
      const h = el.clientHeight;
      setPositions((prev) => {
        const resolved = resolveOverlaps2D(prev, w, h);
        return resolved ?? prev;
      });
    }, 800);

    return () => clearInterval(timer);
  }, [containerRef]);

  return positions;
}

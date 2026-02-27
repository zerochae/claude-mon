import { useState, useEffect, useRef, useMemo } from "react";
import { css, cva } from "@styled-system/css";
import { SessionState } from "@/lib/tauri";
import { getMascotColor } from "@/lib/colors";
import { MascotCanvas } from "@/components/MascotCanvas";
import { StatusBubble } from "@/components/StatusBubble";
import { MOTION } from "@/lib/motion";
import { Button } from "@/components/Button";

interface HouseViewProps {
  sessions: SessionState[];
  onSelectSession: (session: SessionState) => void;
}

const MASCOT_SIZE = 20;
const LABEL_HEIGHT = 16;
const BUBBLE_HEIGHT = 30;
const SLOT_W = 70;
const PAD_X = 10;
const PAD_Y_TOP = BUBBLE_HEIGHT + 6;
const PAD_Y_BOTTOM = LABEL_HEIGHT + 4;
const HITBOX_X = MASCOT_SIZE + 20;
const HITBOX_Y = MASCOT_SIZE + BUBBLE_HEIGHT + LABEL_HEIGHT + 8;
const WANDER_INTERVAL = 2200;

const PHASE_SHORT: Record<string, string> = {
  idle: "Idle",
  processing: "Processing",
  waiting_for_input: "Waiting input",
  waiting_for_approval: "Needs approval",
  compacting: "Compacting",
  ended: "Ended",
};

interface MascotPos {
  x: number;
  y: number;
  facingRight: boolean;
}

function getMoveParams(phase: string): { chance: number; range: number } {
  switch (phase) {
    case "processing":
      return { chance: 0.75, range: 55 };
    case "compacting":
      return { chance: 0.3, range: 25 };
    case "idle":
      return { chance: 0.08, range: 15 };
    default:
      return { chance: 0, range: 0 };
  }
}

function overlaps(a: MascotPos, b: MascotPos): boolean {
  return Math.abs(a.x - b.x) < HITBOX_X && Math.abs(a.y - b.y) < HITBOX_Y;
}

function hasCollision(
  id: string,
  pos: MascotPos,
  all: Record<string, MascotPos>,
): boolean {
  for (const [otherId, otherPos] of Object.entries(all)) {
    if (otherId === id) continue;
    if (overlaps(pos, otherPos)) return true;
  }
  return false;
}

function resolveOverlaps2D(
  positions: Record<string, MascotPos>,
  w: number,
  h: number,
): Record<string, MascotPos> | null {
  const ids = Object.keys(positions);
  if (ids.length < 2) return null;

  const next = { ...positions };
  let changed = false;
  let iterations = 0;

  while (iterations < 5) {
    let anyOverlap = false;
    for (let i = 0; i < ids.length; i++) {
      for (let j = i + 1; j < ids.length; j++) {
        const a = next[ids[i]];
        const b = next[ids[j]];
        if (!overlaps(a, b)) continue;
        anyOverlap = true;
        changed = true;
        const dx = b.x - a.x || (Math.random() - 0.5) * 2;
        const dy = b.y - a.y || (Math.random() - 0.5) * 2;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const pushX = (dx / dist) * HITBOX_X * 0.6;
        const pushY = (dy / dist) * HITBOX_Y * 0.6;
        next[ids[i]] = {
          ...a,
          x: Math.max(PAD_X, Math.min(w - SLOT_W - PAD_X, a.x - pushX)),
          y: Math.max(
            PAD_Y_TOP,
            Math.min(
              h - MASCOT_SIZE - LABEL_HEIGHT - PAD_Y_BOTTOM,
              a.y - pushY,
            ),
          ),
        };
        next[ids[j]] = {
          ...b,
          x: Math.max(PAD_X, Math.min(w - SLOT_W - PAD_X, b.x + pushX)),
          y: Math.max(
            PAD_Y_TOP,
            Math.min(
              h - MASCOT_SIZE - LABEL_HEIGHT - PAD_Y_BOTTOM,
              b.y + pushY,
            ),
          ),
        };
      }
    }
    if (!anyOverlap) break;
    iterations++;
  }

  return changed ? next : null;
}

const emptyState = css({
  flex: 1,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  color: "comment",
  fontSize: "13px",
});

const outerContainer = css({
  flex: 1,
  display: "flex",
  flexDirection: "column",
  overflow: "hidden",
});

const canvas = css({
  flex: 1,
  pos: "relative",
  overflow: "hidden",
  backgroundImage:
    "radial-gradient(circle, token(colors.bg3) 0.6px, transparent 0.6px)",
  backgroundSize: "14px 14px",
});

const mascotSlot = css({
  pos: "absolute",
  cursor: "pointer",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: "2px",
});

const spriteWrapper = cva({
  base: {},
  variants: {
    facing: {
      right: { transform: "scaleX(1)" },
      left: { transform: "scaleX(-1)" },
    },
    animation: {
      approval: { animation: "mascot-bounce 0.6s ease-in-out infinite" },
      input: { animation: "mascot-bounce 1.2s ease-in-out infinite" },
      none: {},
    },
  },
  defaultVariants: { facing: "right", animation: "none" },
});

const mascotLabel = cva({
  base: {
    fontSize: "9px",
    textAlign: "center",
    whiteSpace: "nowrap",
    maxW: "70px",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  variants: {
    urgent: {
      true: { color: "red", fontWeight: 600 },
      false: { color: "comment", fontWeight: 400 },
    },
  },
  defaultVariants: { urgent: false },
});

const bottomPanel = css({
  flexShrink: 0,
  borderTop: "0.5px solid token(colors.hairline)",
  maxH: "45%",
  display: "flex",
  flexDirection: "column",
});

const statusBar = css({
  padding: "5px 12px",
  color: "comment",
  fontSize: "10px",
  display: "flex",
  gap: "6px",
  borderBottom: "0.5px solid token(colors.hairlineFaint)",
  bg: "transparent",
});

const sessionListScroll = css({
  overflowY: "auto",
  flex: 1,
});

const sessionItem = css({
  display: "flex",
  alignItems: "center",
  gap: "8px",
  padding: "6px 12px",
  cursor: "pointer",
  borderBottom: "0.5px solid token(colors.hairlineFaint)",
  transition: MOTION.transition.color,
  _hover: { bg: "surfaceHover" },
  _active: { bg: "surfaceActive" },
});

const priorityDot = cva({
  base: {
    w: "6px",
    h: "6px",
    borderRadius: "50%",
    flexShrink: 0,
  },
  variants: {
    urgent: {
      true: {
        bg: "red",
        shadow: "0 0 3px token(colors.red), 0 0 8px rgba(224, 108, 117, 0.3)",
      },
      false: {},
    },
  },
  defaultVariants: { urgent: false },
});

const sessionContent = css({ flex: 1, minW: 0 });

const sessionName = css({
  color: "text",
  fontSize: "11px",
  fontWeight: 500,
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
});

const sessionPhase = css({
  color: "comment",
  fontSize: "9px",
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
});

const actionButtons = css({
  display: "flex",
  gap: "4px",
  flexShrink: 0,
});

export function HouseView({ sessions, onSelectSession }: HouseViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [positions, setPositions] = useState<Record<string, MascotPos>>({});
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [dismissedActivity, setDismissedActivity] = useState<
    Map<string, number>
  >(new Map());
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
  }, []);

  const dismissedIds = useMemo(() => {
    const result = new Set<string>();
    for (const s of sessions) {
      const dismissedAt = dismissedActivity.get(s.session_id);
      if (dismissedAt !== undefined && dismissedAt === s.last_activity) {
        result.add(s.session_id);
      }
    }
    return result;
  }, [sessions, dismissedActivity]);

  const activeSessions = sessions.filter((s) => s.phase !== "ended");
  const waitingSessions = sessions.filter(
    (s) =>
      s.phase === "waiting_for_input" || s.phase === "waiting_for_approval",
  );

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
  }, [sessions]);

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
  }, [sessions]);

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
  }, []);

  if (sessions.length === 0) {
    return <div className={emptyState}>No sessions running</div>;
  }

  return (
    <div className={outerContainer}>
      <div ref={containerRef} className={canvas}>
        {sessions.map((session) => {
          const color = getMascotColor(session.color_index);
          const pos = positions[session.session_id];
          if (
            !Object.prototype.hasOwnProperty.call(positions, session.session_id)
          )
            return null;
          const isUrgent = session.phase === "waiting_for_approval";
          const isHovered = hoveredId === session.session_id;

          const animVariant =
            session.phase === "waiting_for_approval"
              ? ("approval" as const)
              : session.phase === "waiting_for_input"
                ? ("input" as const)
                : ("none" as const);

          return (
            <div
              key={session.session_id}
              className={mascotSlot}
              onClick={() => {
                setDismissedActivity((prev) => {
                  const next = new Map(prev);
                  next.set(session.session_id, session.last_activity);
                  return next;
                });
                onSelectSession(session);
              }}
              onMouseEnter={() => setHoveredId(session.session_id)}
              onMouseLeave={() => setHoveredId(null)}
              style={{
                left: pos.x,
                top: pos.y,
                transition: `left ${WANDER_INTERVAL}ms ease-in-out, top ${WANDER_INTERVAL}ms ease-in-out, transform 0.15s ease, filter 0.15s ease`,
                ...(isHovered
                  ? {
                      transform: "scale(1.25)",
                      filter: `drop-shadow(0 0 6px ${color}66)`,
                      zIndex: 10,
                    }
                  : {}),
              }}
            >
              <StatusBubble
                phase={session.phase}
                lastActivity={session.last_activity}
                dismissed={dismissedIds.has(session.session_id)}
              />
              <div
                className={spriteWrapper({
                  facing: pos.facingRight ? "right" : "left",
                  animation: animVariant,
                })}
              >
                <MascotCanvas
                  color={color}
                  phase={session.phase}
                  size={MASCOT_SIZE}
                />
              </div>
              <span className={mascotLabel({ urgent: isUrgent })}>
                {session.project_name}
              </span>
            </div>
          );
        })}
      </div>

      <div className={bottomPanel}>
        <div className={statusBar}>
          <span>{activeSessions.length} active</span>
          <span>&middot;</span>
          <span>{waitingSessions.length} waiting</span>
        </div>
        <div className={sessionListScroll}>
          {[...sessions]
            .sort((a, b) => {
              const priority = (p: string) =>
                p === "waiting_for_approval"
                  ? 0
                  : p === "waiting_for_input"
                    ? 1
                    : p === "processing"
                      ? 2
                      : p === "ended"
                        ? 4
                        : 3;
              return priority(a.phase) - priority(b.phase);
            })
            .map((session) => {
              const color = getMascotColor(session.color_index);
              const isUrgent = session.phase === "waiting_for_approval";
              const phaseLabel = PHASE_SHORT[session.phase] ?? session.phase;

              return (
                <div
                  key={session.session_id}
                  onClick={() => onSelectSession(session)}
                  className={sessionItem}
                  onMouseEnter={() => setHoveredId(session.session_id)}
                  onMouseLeave={() => setHoveredId(null)}
                >
                  <div
                    className={priorityDot({ urgent: isUrgent })}
                    style={!isUrgent ? { background: color } : undefined}
                  />
                  <div className={sessionContent}>
                    <div className={sessionName}>{session.project_name}</div>
                    <div className={sessionPhase}>
                      {phaseLabel}
                      {session.tool_name ? ` · ${session.tool_name}` : ""}
                    </div>
                  </div>
                  <div className={actionButtons}>
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectSession(session);
                      }}
                      title="Detail"
                    >
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 14 14"
                        fill="none"
                      >
                        <circle
                          cx="7"
                          cy="7"
                          r="3"
                          stroke="var(--colors-comment, #565c64)"
                          strokeWidth="1.2"
                        />
                        <circle
                          cx="7"
                          cy="7"
                          r="1"
                          fill="var(--colors-comment, #565c64)"
                        />
                      </svg>
                    </Button>
                  </div>
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
}

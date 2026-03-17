import { useState, useCallback, useRef, useEffect } from "react";
import { resizeAnchored, animateWindowSize } from "@/utils/windowManager";
import { type WindowAnchor, type DockPosition } from "@/hooks/useSettings";
import { useDisplayWatch } from "@/hooks/useDisplayWatch";

const EXPANDED_HEIGHT = 460;
const ANIM_MS = 250;

export interface WindowExpansionConfig {
  barWidth: number;
  barHeight: number;
  anchor: WindowAnchor;
  dock: DockPosition;
  dockMargin: number;
  barExtraHeight?: number;
  ready?: boolean;
}

export function useWindowExpansion(
  defaultExpandedWidth: number,
  config: WindowExpansionConfig,
) {
  const {
    barWidth,
    barHeight,
    anchor,
    dock,
    dockMargin,
    barExtraHeight = 0,
    ready = true,
  } = config;
  const [expanded, setExpanded] = useState(false);
  const [showContent, setShowContent] = useState(false);
  const [currentWidth, setCurrentWidth] = useState(defaultExpandedWidth);
  const [animating, setAnimating] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();
  const animatingRef = useRef(false);

  const activeWidth = expanded ? currentWidth : barWidth;
  const currentHeight = expanded
    ? EXPANDED_HEIGHT + barExtraHeight
    : barHeight + barExtraHeight;

  useDisplayWatch({
    width: activeWidth,
    height: currentHeight,
    anchor,
    dock,
    dockMargin,
    enabled: ready && !animating,
  });

  useEffect(() => {
    if (!ready || animating) return;
    resizeAnchored(
      activeWidth,
      expanded ? EXPANDED_HEIGHT + barExtraHeight : barHeight + barExtraHeight,
      anchor,
      dock,
      dockMargin,
    ).catch(() => undefined);
  }, [
    ready,
    animating,
    activeWidth,
    barHeight,
    barExtraHeight,
    expanded,
    anchor,
    dock,
    dockMargin,
  ]);

  const expand = useCallback(
    (targetW: number) => {
      clearTimeout(timerRef.current);
      setCurrentWidth(targetW);
      setExpanded(true);
      animatingRef.current = true;
      setAnimating(true);
      void animateWindowSize(
        barWidth,
        targetW,
        barHeight,
        EXPANDED_HEIGHT,
        anchor,
        dock,
        dockMargin,
        ANIM_MS,
        () => {
          animatingRef.current = false;
          setAnimating(false);
        },
      );
      timerRef.current = setTimeout(() => setShowContent(true), 30);
    },
    [barWidth, barHeight, anchor, dock, dockMargin],
  );

  const collapse = useCallback(() => {
    clearTimeout(timerRef.current);
    setShowContent(false);
    timerRef.current = setTimeout(() => {
      setExpanded(false);
      animatingRef.current = true;
      setAnimating(true);
      void animateWindowSize(
        activeWidth,
        barWidth,
        EXPANDED_HEIGHT,
        barHeight,
        anchor,
        dock,
        dockMargin,
        ANIM_MS,
        () => {
          animatingRef.current = false;
          setAnimating(false);
        },
      );
    }, ANIM_MS);
  }, [activeWidth, barWidth, barHeight, anchor, dock, dockMargin]);

  const toggleExpand = useCallback(
    (targetW: number) => {
      if (expanded) collapse();
      else expand(targetW);
    },
    [expanded, expand, collapse],
  );

  const animateToView = useCallback(
    (fromW: number, toW: number) => {
      if (fromW === toW) return;
      setCurrentWidth(toW);
      animatingRef.current = true;
      setAnimating(true);
      void animateWindowSize(
        fromW,
        toW,
        EXPANDED_HEIGHT,
        EXPANDED_HEIGHT,
        anchor,
        dock,
        dockMargin,
        ANIM_MS,
        () => {
          animatingRef.current = false;
          setAnimating(false);
        },
      );
    },
    [anchor, dock, dockMargin],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && expanded) collapse();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [expanded, collapse]);

  return {
    expanded,
    showContent,
    activeWidth,
    setActiveWidth: setCurrentWidth,
    expand,
    collapse,
    toggleExpand,
    animateToView,
  };
}

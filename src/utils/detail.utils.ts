export function extraUsageFillStyle(utilization: number) {
  return {
    width: `${Math.min(100, utilization)}%`,
    background: "var(--colors-orange)",
  };
}

export function formatTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return String(n);
}

export function shortenHome(path: string): string {
  return path.replace(/^\/(?:Users|home)\/[^/]+/, "~");
}

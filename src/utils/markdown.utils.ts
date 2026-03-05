import React from "react";

export function parseCallout(children: React.ReactNode): {
  tag: string | null;
  content: React.ReactNode;
} {
  const arr = React.Children.toArray(children);
  if (arr.length === 0) return { tag: null, content: children };

  const firstIdx = arr.findIndex((c) => React.isValidElement(c));
  if (firstIdx === -1) return { tag: null, content: children };
  const first = arr[firstIdx];

  const innerChildren = (
    (first as React.ReactElement).props as { children?: React.ReactNode }
  ).children;
  if (!innerChildren) return { tag: null, content: children };

  const innerArr = React.Children.toArray(innerChildren);
  if (innerArr.length === 0) return { tag: null, content: children };

  const firstText = innerArr[0];
  if (typeof firstText !== "string") return { tag: null, content: children };

  const match = /^\s*\[!(\w+)\]\s*/.exec(firstText);
  if (!match) return { tag: null, content: children };

  const tag = match[1].toLowerCase();
  const cleaned = firstText.replace(/^\s*\[!\w+\]\s*/, "");
  const newInner = [cleaned, ...innerArr.slice(1)];
  const newFirst = React.cloneElement(
    first as React.ReactElement,
    {},
    ...newInner,
  );
  const rest = arr.filter((_, i) => i !== firstIdx);

  return { tag, content: [newFirst, ...rest] };
}

export const preInner = (lang: string) => ({
  background: "transparent",
  color: "var(--colors-preText, #abb2bf)",
  padding: "0.5rem 0.6rem",
  paddingTop: lang ? "0" : "0.5rem",
  overflowX: "auto" as const,
  maxWidth: "100%",
  fontSize: "0.8rem",
});

import { useEffect, useState } from "react";

import { SPINNER_SYMBOLS } from "@/constants/spinners";

export function ProcessingSpinner({ className }: { className?: string }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((i) => (i + 1) % SPINNER_SYMBOLS.length);
    }, 150);
    return () => clearInterval(timer);
  }, []);

  return <span className={className}>{SPINNER_SYMBOLS[index]}</span>;
}

export function CompactingDots({ className }: { className?: string }) {
  const [count, setCount] = useState(1);

  useEffect(() => {
    const timer = setInterval(() => setCount((c) => (c % 3) + 1), 400);
    return () => clearInterval(timer);
  }, []);

  return <span className={className}>{"·".repeat(count)}</span>;
}

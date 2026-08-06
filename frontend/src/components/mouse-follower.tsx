"use client";

import { useEffect, useState } from "react";

/**
 * MouseFollower - Macau-themed decorative elements that follow the cursor.
 * - A soft jade/azulejo radial glow
 * - Two floating azulejo-style tile diamonds at different delays
 * Only renders on client-side (no SSR).
 */
export function MouseFollower() {
  const [pos, setPos] = useState({ x: -9999, y: -9999 });
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setPos({ x: e.clientX, y: e.clientY });
      if (!visible) setVisible(true);
    };

    const handleMouseLeave = () => setVisible(false);
    const handleMouseEnter = () => setVisible(true);

    window.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseleave", handleMouseLeave);
    document.addEventListener("mouseenter", handleMouseEnter);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseleave", handleMouseLeave);
      document.removeEventListener("mouseenter", handleMouseEnter);
    };
  }, [visible]);

  // Don't render on touch-only devices
  if (typeof window !== "undefined" && "ontouchstart" in window) return null;

  return (
    <div aria-hidden="true" className="pointer-events-none">
      {/* Main glow - follows cursor closely */}
      <div
        className="cursor-glow"
        style={{
          left: pos.x,
          top: pos.y,
          opacity: visible ? 1 : 0,
        }}
      />
      {/* Azulejo tile - delayed follow */}
      <div
        className="cursor-tile"
        style={{
          left: pos.x + 20,
          top: pos.y - 30,
          opacity: visible ? 1 : 0,
        }}
      />
      {/* Smaller brass tile - even more delayed */}
      <div
        className="cursor-tile-sm"
        style={{
          left: pos.x - 25,
          top: pos.y + 20,
          opacity: visible ? 1 : 0,
        }}
      />
    </div>
  );
}

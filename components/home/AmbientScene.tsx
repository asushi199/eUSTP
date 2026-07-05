"use client";

import { useEffect } from "react";

export function AmbientScene() {
  useEffect(() => {
    const canTrackPointer = window.matchMedia(
      "(pointer: fine) and (prefers-reduced-motion: no-preference)",
    );

    const updatePointer = (event: PointerEvent) => {
      document.documentElement.style.setProperty(
        "--portal-pointer-x",
        `${event.clientX}px`,
      );
      document.documentElement.style.setProperty(
        "--portal-pointer-y",
        `${event.clientY}px`,
      );
    };

    if (canTrackPointer.matches) {
      window.addEventListener("pointermove", updatePointer, { passive: true });
    }

    return () => window.removeEventListener("pointermove", updatePointer);
  }, []);

  return (
    <div className="portal-ambient" aria-hidden="true">
      <div className="portal-ambient-mesh" />
      <div className="portal-ambient-blob portal-ambient-blob-one" />
      <div className="portal-ambient-blob portal-ambient-blob-two" />
      <div className="portal-pointer-glow" />
    </div>
  );
}

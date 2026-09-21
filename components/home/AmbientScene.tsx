"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

type AmbientSceneProps = {
  /** Pointer-follow glow — homepage only */
  interactive?: boolean;
};

export function AmbientScene({ interactive = false }: AmbientSceneProps) {
  const pathname = usePathname();
  const isInteractive = interactive || pathname === "/";

  useEffect(() => {
    if (!isInteractive) return;

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
  }, [isInteractive]);

  return (
    <div className="portal-ambient" aria-hidden="true">
      <div className="portal-ambient-mesh" />
      <div className="portal-ambient-blob portal-ambient-blob-one" />
      <div className="portal-ambient-blob portal-ambient-blob-two" />
      {isInteractive ? <div className="portal-pointer-glow" /> : null}
    </div>
  );
}

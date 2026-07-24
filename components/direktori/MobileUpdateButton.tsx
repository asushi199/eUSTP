"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const UPDATE_CARD_ID = "direktori-kemaskini";

export default function MobileUpdateButton() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const updateCard = document.getElementById(UPDATE_CARD_ID);
    if (!updateCard) return;

    const observer = new IntersectionObserver(
      ([entry]) => setVisible(!entry.isIntersecting),
      { rootMargin: "-128px 0px 0px" },
    );

    observer.observe(updateCard);
    return () => observer.disconnect();
  }, []);

  if (!visible) return null;

  return (
    <Link
      href="/direktori/kemaskini"
      className="fixed bottom-24 right-4 z-40 flex h-12 items-center gap-1.5 rounded-full bg-primary px-4 text-xs font-bold text-white shadow-modal transition hover:bg-primary-bright active:scale-95 md:hidden"
    >
      <svg
        aria-hidden
        className="h-4 w-4 shrink-0"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2.2}
        viewBox="0 0 24 24"
      >
        <path d="M4 20h4l10.5-10.5a2.8 2.8 0 0 0-4-4L4 16v4Z" />
        <path d="m12.5 7.5 4 4" />
      </svg>
      Kemas Kini
    </Link>
  );
}

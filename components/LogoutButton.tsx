"use client";

import { signOut } from "next-auth/react";

export default function LogoutButton() {
  return (
    <button
      type="button"
      className="btn-outline-ink btn-sm normal-case tracking-normal"
      onClick={() => void signOut({ callbackUrl: "/" })}
    >
      Log Keluar
    </button>
  );
}

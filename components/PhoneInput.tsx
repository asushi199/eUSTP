"use client";

import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

/**
 * Input nombor telefon yang mengunci input kepada digit sahaja —
 * ruang, sempang dan aksara lain dibuang serta-merta semasa menaip
 * (dan semasa tampal). Boleh guna terkawal (value/onChange) atau tidak
 * terkawal (name untuk server action). Kelas asas `.input` dikekalkan.
 */
const PhoneInput = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  function PhoneInput({ className, onChange, inputMode, ...props }, ref) {
    return (
      <input
        ref={ref}
        {...props}
        type="tel"
        inputMode={inputMode ?? "numeric"}
        className={cn("input", className)}
        onChange={(e) => {
          const digits = e.currentTarget.value.replace(/\D/g, "");
          if (e.currentTarget.value !== digits) {
            e.currentTarget.value = digits;
          }
          onChange?.(e);
        }}
      />
    );
  },
);

export default PhoneInput;

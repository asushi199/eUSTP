"use client";

import { useEffect, useRef } from "react";
import type { EquipmentSignatureStroke } from "@/lib/peralatan/types";

export default function SignaturePad({
  id,
  value,
  onChange,
  disabled = false,
}: {
  id: string;
  value: EquipmentSignatureStroke[];
  onChange: (strokes: EquipmentSignatureStroke[]) => void;
  disabled?: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawingRef = useRef(false);
  const activeStrokeRef = useRef<EquipmentSignatureStroke | null>(null);
  const baseStrokesRef = useRef<EquipmentSignatureStroke[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const ratio = Math.max(window.devicePixelRatio || 1, 1);
    canvas.width = Math.max(1, Math.round(rect.width * ratio));
    canvas.height = Math.max(1, Math.round(rect.height * ratio));
    const context = canvas.getContext("2d");
    if (!context) return;
    context.scale(ratio, ratio);
    context.clearRect(0, 0, rect.width, rect.height);
    context.strokeStyle = "#111827";
    context.lineWidth = 2;
    context.lineCap = "round";
    context.lineJoin = "round";
    for (const stroke of value) {
      if (stroke.length < 2) continue;
      context.beginPath();
      context.moveTo(stroke[0].x * rect.width, stroke[0].y * rect.height);
      for (const point of stroke.slice(1)) {
        context.lineTo(point.x * rect.width, point.y * rect.height);
      }
      context.stroke();
    }
  }, [value]);

  function pointFromEvent(event: React.PointerEvent<HTMLCanvasElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    return {
      x: Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width)),
      y: Math.min(1, Math.max(0, (event.clientY - rect.top) / rect.height)),
    };
  }

  function startDrawing(event: React.PointerEvent<HTMLCanvasElement>) {
    if (disabled) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    drawingRef.current = true;
    baseStrokesRef.current = value;
    activeStrokeRef.current = [pointFromEvent(event)];
  }

  function continueDrawing(event: React.PointerEvent<HTMLCanvasElement>) {
    if (!drawingRef.current || !activeStrokeRef.current || disabled) return;
    const nextStroke = [...activeStrokeRef.current, pointFromEvent(event)];
    activeStrokeRef.current = nextStroke;
    onChange([...baseStrokesRef.current, nextStroke]);
  }

  function finishDrawing() {
    if (!drawingRef.current || !activeStrokeRef.current) return;
    const completed =
      activeStrokeRef.current.length >= 2 ? activeStrokeRef.current : null;
    drawingRef.current = false;
    activeStrokeRef.current = null;
    if (completed) onChange([...baseStrokesRef.current, completed]);
  }

  return (
    <div>
      <canvas
        ref={canvasRef}
        id={id}
        aria-label="Ruang tandatangan"
        className="h-40 w-full touch-none rounded-lg border border-slate-300 bg-white"
        onPointerDown={startDrawing}
        onPointerMove={continueDrawing}
        onPointerUp={finishDrawing}
        onPointerCancel={finishDrawing}
        onPointerLeave={(event) => {
          if (event.currentTarget.hasPointerCapture(event.pointerId)) return;
          finishDrawing();
        }}
      />
      <div className="mt-2 flex items-center justify-between gap-3">
        <p className="text-xs text-graphite">Tandatangan dalam petak putih.</p>
        <button
          type="button"
          className="text-xs font-semibold text-primary hover:underline disabled:opacity-50"
          disabled={disabled || value.length === 0}
          onClick={() => onChange([])}
        >
          Padam tandatangan
        </button>
      </div>
    </div>
  );
}

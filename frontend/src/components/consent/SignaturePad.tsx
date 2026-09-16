import { useEffect, useRef, useState } from 'react';
import { Eraser } from 'lucide-react';
import { Button } from '../common/Button';

// A small self-contained signature pad built on the Canvas + Pointer Events API rather
// than a third-party library: it needs to work identically for finger (tablet), stylus,
// and mouse input with no extra hardware, and Pointer Events already unify all three.
export function SignaturePad({ onChange }: { onChange: (dataUrl: string | null) => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const drawingRef = useRef(false);
  const hasInkRef = useRef(false);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);
  const [empty, setEmpty] = useState(true);

  function setupCanvas() {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    const dpr = Math.max(window.devicePixelRatio || 1, 1);
    const width = container.clientWidth;
    const height = 220;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.scale(dpr, dpr);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);
    ctx.strokeStyle = '#1a514e';
    ctx.lineWidth = 2.2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }

  // The canvas is sized once, at mount, and deliberately left alone after that. An
  // earlier version re-sized (and wiped) the pad on every `window` resize event, but
  // resize fires for reasons that have nothing to do with the pad actually changing
  // size - scrolling, a mobile on-screen keyboard opening, minor layout shifts - and
  // each one silently erased a patient's already-captured signature. Losing the
  // signature is a far worse failure than the canvas staying its original size through
  // a genuine orientation change.
  useEffect(() => {
    setupCanvas();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function getPoint(e: React.PointerEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  function handlePointerDown(e: React.PointerEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.setPointerCapture(e.pointerId);
    drawingRef.current = true;
    lastPointRef.current = getPoint(e);
  }

  function handlePointerMove(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!drawingRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx || !lastPointRef.current) return;
    const point = getPoint(e);
    ctx.beginPath();
    ctx.moveTo(lastPointRef.current.x, lastPointRef.current.y);
    ctx.lineTo(point.x, point.y);
    ctx.stroke();
    lastPointRef.current = point;
    hasInkRef.current = true;
  }

  function finishStroke() {
    if (!drawingRef.current) return;
    drawingRef.current = false;
    lastPointRef.current = null;
    if (hasInkRef.current) {
      setEmpty(false);
      onChange(canvasRef.current?.toDataURL('image/png') ?? null);
    }
  }

  function handleClear() {
    setupCanvas();
    hasInkRef.current = false;
    setEmpty(true);
    onChange(null);
  }

  return (
    <div className="space-y-2">
      <div
        ref={containerRef}
        className="relative overflow-hidden rounded-xl border-2 border-dashed border-ink-300 bg-white"
        style={{ touchAction: 'none' }}
      >
        <canvas
          ref={canvasRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={finishStroke}
          onPointerLeave={finishStroke}
          onPointerCancel={finishStroke}
          className="block rounded-xl"
        />
        {empty && (
          <p className="pointer-events-none absolute bottom-2 left-1/2 -translate-x-1/2 text-xs font-medium uppercase tracking-wide text-ink-300">
            Sign Here
          </p>
        )}
      </div>
      <div className="flex justify-end">
        <Button type="button" variant="outline" size="sm" onClick={handleClear}>
          <Eraser size={14} /> Clear Signature
        </Button>
      </div>
    </div>
  );
}

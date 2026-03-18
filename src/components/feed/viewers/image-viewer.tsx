"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Loader2, AlertCircle, ZoomIn, ZoomOut, RotateCw, Maximize } from "lucide-react";

interface ImageViewerProps {
  url: string;
  alt: string;
}

const ZOOM_STEP = 0.25;
const MIN_ZOOM = 0.1;
const MAX_ZOOM = 5;
const ROTATE_STEP = 90;

export function ImageViewer({ url, alt }: ImageViewerProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [translate, setTranslate] = useState({ x: 0, y: 0 });
  const [imageDimensions, setImageDimensions] = useState<{ w: number; h: number } | null>(null);
  const dragStart = useRef({ x: 0, y: 0 });
  const translateStart = useRef({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const handleZoomIn = useCallback(() => {
    setZoom((z) => Math.min(z + ZOOM_STEP, MAX_ZOOM));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoom((z) => Math.max(z - ZOOM_STEP, MIN_ZOOM));
  }, []);

  const handleRotate = useCallback(() => {
    setRotation((r) => (r + ROTATE_STEP) % 360);
  }, []);

  const handleReset = useCallback(() => {
    setZoom(1);
    setRotation(0);
    setTranslate({ x: 0, y: 0 });
  }, []);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP;
    setZoom((z) => Math.max(MIN_ZOOM, Math.min(z + delta, MAX_ZOOM)));
  }, []);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (zoom <= 1) return;
      e.preventDefault();
      setIsDragging(true);
      dragStart.current = { x: e.clientX, y: e.clientY };
      translateStart.current = { ...translate };
    },
    [zoom, translate]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isDragging) return;
      const dx = e.clientX - dragStart.current.x;
      const dy = e.clientY - dragStart.current.y;
      setTranslate({
        x: translateStart.current.x + dx,
        y: translateStart.current.y + dy,
      });
    },
    [isDragging]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (!isDragging) return;
    const handleGlobalUp = () => setIsDragging(false);
    window.addEventListener("mouseup", handleGlobalUp);
    return () => window.removeEventListener("mouseup", handleGlobalUp);
  }, [isDragging]);

  const handleDoubleClick = useCallback(() => {
    if (zoom === 1) {
      setZoom(2);
    } else {
      handleReset();
    }
  }, [zoom, handleReset]);

  const zoomPercent = Math.round(zoom * 100);

  if (hasError) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
        <AlertCircle className="size-8 text-red-400" />
        <p className="text-sm text-[var(--text-muted)]">Failed to load image</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {/* ─── Image Canvas ─── */}
      <div
        ref={containerRef}
        className={cn(
          "relative flex min-h-[50vh] max-h-[70vh] items-center justify-center overflow-hidden",
          "bg-[repeating-conic-gradient(var(--bg-elevated)_0%_25%,var(--bg-secondary)_0%_50%)]",
          "bg-[length:20px_20px]",
          zoom > 1 ? "cursor-grab" : "cursor-zoom-in",
          isDragging && "cursor-grabbing"
        )}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onDoubleClick={handleDoubleClick}
      >
        {isLoading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-[var(--bg-primary)]">
            <Loader2 className="size-6 animate-spin text-[var(--accent-primary)]" />
          </div>
        )}
        <img
          src={url}
          alt={alt}
          draggable={false}
          onLoad={(e) => {
            setIsLoading(false);
            const img = e.currentTarget;
            setImageDimensions({ w: img.naturalWidth, h: img.naturalHeight });
          }}
          onError={() => {
            setIsLoading(false);
            setHasError(true);
          }}
          className={cn(
            "max-h-[70vh] max-w-full object-contain transition-transform select-none",
            isDragging ? "duration-0" : "duration-200 ease-out"
          )}
          style={{
            transform: `translate(${translate.x}px, ${translate.y}px) scale(${zoom}) rotate(${rotation}deg)`,
          }}
        />
      </div>

      {/* ─── Controls Bar ─── */}
      <div className="flex items-center justify-between border-t border-[var(--border-subtle)] bg-[var(--bg-secondary)]/80 px-4 py-2 backdrop-blur-sm">
        <div className="text-[11px] text-[var(--text-muted)]">
          {imageDimensions
            ? `${imageDimensions.w} x ${imageDimensions.h}px`
            : ""}
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={handleZoomOut}
            disabled={zoom <= MIN_ZOOM}
            className={cn(
              "flex size-7 items-center justify-center rounded-md transition-colors",
              "text-[var(--text-muted)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]",
              "disabled:opacity-30 disabled:pointer-events-none"
            )}
            title="Zoom out"
          >
            <ZoomOut className="size-3.5" strokeWidth={1.8} />
          </button>
          <span className="min-w-[3.5rem] text-center text-[11px] font-medium tabular-nums text-[var(--text-muted)]">
            {zoomPercent}%
          </span>
          <button
            onClick={handleZoomIn}
            disabled={zoom >= MAX_ZOOM}
            className={cn(
              "flex size-7 items-center justify-center rounded-md transition-colors",
              "text-[var(--text-muted)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]",
              "disabled:opacity-30 disabled:pointer-events-none"
            )}
            title="Zoom in"
          >
            <ZoomIn className="size-3.5" strokeWidth={1.8} />
          </button>
          <div className="mx-1.5 h-4 w-px bg-[var(--border-subtle)]" />
          <button
            onClick={handleRotate}
            className={cn(
              "flex size-7 items-center justify-center rounded-md transition-colors",
              "text-[var(--text-muted)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]"
            )}
            title="Rotate 90deg"
          >
            <RotateCw className="size-3.5" strokeWidth={1.8} />
          </button>
          <button
            onClick={handleReset}
            className={cn(
              "flex size-7 items-center justify-center rounded-md transition-colors",
              "text-[var(--text-muted)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]"
            )}
            title="Reset view"
          >
            <Maximize className="size-3.5" strokeWidth={1.8} />
          </button>
        </div>
        <div className="min-w-[4rem]" />
      </div>
    </div>
  );
}

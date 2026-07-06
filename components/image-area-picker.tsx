"use client"

import { useRef, useState } from "react"
import type { MouseEvent as ReactMouseEvent } from "react"
import { Upload, ImageIcon, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"

export interface CorrectArea {
  x1: number
  y1: number
  x2: number
  y2: number
}

interface ImageAreaPickerProps {
  imageUrl: string | null
  correctArea: CorrectArea | null
  onAreaChange: (area: CorrectArea | null) => void
  onUpload: (file: File) => void
  uploading?: boolean
}

/**
 * El profesor sube una imagen y arrastra para marcar la ZONA CORRECTA (rectángulo).
 * Coordenadas normalizadas 0-1 (fracción de la imagen), para que coincidan con el
 * clic del alumno en cualquier tamaño de pantalla.
 */
export function ImageAreaPicker({
  imageUrl,
  correctArea,
  onAreaChange,
  onUpload,
  uploading,
}: ImageAreaPickerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [start, setStart] = useState<{ x: number; y: number } | null>(null)
  const [current, setCurrent] = useState<{ x: number; y: number } | null>(null)

  const toNorm = (e: ReactMouseEvent) => {
    const el = containerRef.current
    if (!el) return { x: 0, y: 0 }
    const rect = el.getBoundingClientRect()
    return {
      x: Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width)),
      y: Math.min(1, Math.max(0, (e.clientY - rect.top) / rect.height)),
    }
  }

  const handleDown = (e: ReactMouseEvent) => {
    const p = toNorm(e)
    setStart(p)
    setCurrent(p)
  }
  const handleMove = (e: ReactMouseEvent) => {
    if (start) setCurrent(toNorm(e))
  }
  const finish = () => {
    if (start && current) {
      const area: CorrectArea = {
        x1: Math.min(start.x, current.x),
        y1: Math.min(start.y, current.y),
        x2: Math.max(start.x, current.x),
        y2: Math.max(start.y, current.y),
      }
      if (area.x2 - area.x1 > 0.01 && area.y2 - area.y1 > 0.01) {
        onAreaChange(area)
      }
    }
    setStart(null)
    setCurrent(null)
  }

  const drawing =
    start && current
      ? {
          x1: Math.min(start.x, current.x),
          y1: Math.min(start.y, current.y),
          x2: Math.max(start.x, current.x),
          y2: Math.max(start.y, current.y),
        }
      : correctArea

  if (!imageUrl) {
    return (
      <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed p-6 text-sm text-muted-foreground hover:bg-muted/50">
        {uploading ? (
          <>
            <Upload className="h-6 w-6 animate-pulse" />
            Subiendo…
          </>
        ) : (
          <>
            <ImageIcon className="h-6 w-6" />
            <span>Sube la imagen sobre la que el alumno marcará</span>
          </>
        )}
        <input
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className="hidden"
          disabled={uploading}
          onChange={(e) => {
            const f = e.target.files?.[0]
            if (f) onUpload(f)
            e.target.value = ""
          }}
        />
      </label>
    )
  }

  return (
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground">
        Arrastra sobre la imagen para marcar la <strong>zona correcta</strong>. El
        alumno acertará si hace clic dentro de ella.
      </p>
      <div
        ref={containerRef}
        className="relative inline-block select-none cursor-crosshair overflow-hidden rounded-lg border"
        onMouseDown={handleDown}
        onMouseMove={handleMove}
        onMouseUp={finish}
        onMouseLeave={() => {
          if (start) finish()
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageUrl}
          alt="Zona correcta"
          className="block max-w-full pointer-events-none"
          draggable={false}
        />
        {drawing && (
          <div
            className="absolute border-2 border-emerald-500 bg-emerald-500/20 pointer-events-none"
            style={{
              left: `${drawing.x1 * 100}%`,
              top: `${drawing.y1 * 100}%`,
              width: `${(drawing.x2 - drawing.x1) * 100}%`,
              height: `${(drawing.y2 - drawing.y1) * 100}%`,
            }}
          />
        )}
      </div>
      <div className="flex items-center gap-3">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onAreaChange(null)}
          disabled={!correctArea}
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Borrar zona
        </Button>
        {correctArea && (
          <span className="text-xs text-emerald-600">Zona marcada ✓</span>
        )}
      </div>
    </div>
  )
}

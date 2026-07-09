"use client";

import { useState } from "react";
import { Image as ImageIcon, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { apiClient } from "@/lib/api-client";
import { API_CONFIG } from "@/lib/api-config";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

interface SupportImageFieldProps {
  /** URL actual de la imagen de apoyo, o null si no hay. */
  value: string | null;
  onChange: (url: string | null) => void;
}

/**
 * Imagen de apoyo del enunciado (campo `imageUrl` de la pregunta). Es
 * independiente de las imágenes que viven dentro del typeConfig: la base del
 * diagram y la del graph_click con zona marcable.
 */
export function SupportImageField({ value, onChange }: SupportImageFieldProps) {
  const [isUploading, setIsUploading] = useState(false);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await apiClient.upload<{ url: string }>(
        API_CONFIG.ENDPOINTS.UPLOADS,
        form
      );
      onChange(res.url);
      toast.success("Imagen de apoyo subida");
    } catch (error) {
      console.error("Error uploading support image:", error);
      toast.error("No se pudo subir la imagen");
    } finally {
      setIsUploading(false);
      e.target.value = "";
    }
  };

  return (
    <div className="space-y-2">
      <Label>Imagen de apoyo (opcional)</Label>
      <p className="text-xs text-muted-foreground">
        Se muestra junto al enunciado, debajo del texto. Sirve para cualquier
        tipo de pregunta.
      </p>

      {value ? (
        <div className="space-y-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={value}
            alt="Imagen de apoyo"
            className="max-h-64 rounded-lg border"
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onChange(null)}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Quitar imagen
          </Button>
        </div>
      ) : (
        <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed p-6 text-sm text-muted-foreground hover:bg-muted/50">
          {isUploading ? (
            <>
              <Upload className="h-6 w-6 animate-pulse" />
              Subiendo…
            </>
          ) : (
            <>
              <ImageIcon className="h-6 w-6" />
              <span>Haz clic para subir una imagen (PNG, JPG, WebP)</span>
            </>
          )}
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="hidden"
            disabled={isUploading}
            onChange={handleUpload}
          />
        </label>
      )}
    </div>
  );
}

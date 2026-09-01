"use client";

import React, { useState } from "react";
import { CarImage } from "@/types/api";
import { getImageUrl } from "@/lib/image-url";
import { apiClient } from "@/services/api-client";

interface ImageUploaderProps {
  listingId: string;
  images: CarImage[];
  onImagesUpdated: (images: CarImage[]) => void;
}

export function ImageUploader({ listingId, images, onImagesUpdated }: ImageUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    setError(null);

    const formData = new FormData();
    Array.from(files).forEach((file) => {
      formData.append("files", file);
    });

    try {
      const newImages = await apiClient<CarImage[]>(`/listings/${listingId}/images`, {
        method: "POST",
        body: formData,
      });
      if (newImages && Array.isArray(newImages) && newImages.length > 0) {
        onImagesUpdated([...images, ...newImages]);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unable to upload photos. Please try again.";
      setError(msg);
    } finally {
      setUploading(false);
      // Reset input value so the same file can be selected again if needed
      e.target.value = "";
    }
  }

  async function handleDelete(imageId: string) {
    if (!confirm("Are you sure you want to remove this photo?")) return;
    setError(null);
    try {
      await apiClient(`/listings/${listingId}/images/${imageId}`, {
        method: "DELETE",
      });
      onImagesUpdated(images.filter((img) => img.id !== imageId));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unable to remove photo. Please try again.";
      setError(msg);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-slate-900">Vehicle Photos ({images.length})</h3>
        <label className="cursor-pointer rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white transition hover:bg-slate-800 disabled:opacity-50">
          {uploading ? "Uploading Photos..." : "+ Add Photos"}
          <input
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handleFileSelect}
            disabled={uploading}
          />
        </label>
      </div>

      {error && <p className="rounded-xl bg-red-50 p-3 text-xs font-semibold text-red-700">{error}</p>}

      {images.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 p-8 text-center bg-slate-50">
          <p className="text-sm font-medium text-slate-600">No photos uploaded yet</p>
          <p className="mt-1 text-xs text-slate-400">High quality photos increase buyer interest by 3x.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {images.map((img, idx) => (
            <div key={img.id} className="group relative overflow-hidden rounded-xl border bg-slate-100 aspect-video">
              <img
                src={getImageUrl(img.storage_key)}
                alt={`Car photo ${idx + 1}`}
                className="h-full w-full object-cover"
              />
              {img.is_primary && (
                <span className="absolute left-2 top-2 rounded bg-emerald-600 px-2 py-0.5 text-[10px] font-bold uppercase text-white shadow">
                  Cover Photo
                </span>
              )}
              <button
                type="button"
                onClick={() => handleDelete(img.id)}
                className="absolute right-2 top-2 rounded-full bg-slate-900/80 p-1.5 text-xs text-white opacity-0 transition group-hover:opacity-100 hover:bg-red-600"
                title="Remove photo"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

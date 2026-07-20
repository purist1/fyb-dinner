import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { compressImagesForGallery, mapWithConcurrency, withWakeLock } from "@/lib/image-compress";

const BUCKET = "passports";
const GALLERY_UPLOAD_CONCURRENCY = 6;

export async function uploadPassport(file: File): Promise<string> {
  const ext = file.name.split(".").pop() || "jpg";
  const path = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}.${ext}`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, { upsert: false, contentType: file.type });
  if (error) {
    toast.error("Photo upload failed", { description: error.message });
    throw error;
  }
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

function galleryObjectPath(index?: number): string {
  const stamp = `${Date.now()}-${index ?? 0}-${Math.random().toString(36).slice(2, 10)}`;
  return `${stamp}.jpg`;
}

export async function uploadGalleryImage(file: File, options?: { silent?: boolean; index?: number }): Promise<string> {
  const path = galleryObjectPath(options?.index);
  const contentType = file.type || "image/jpeg";
  const { error } = await supabase.storage.from("gallery").upload(path, file, {
    upsert: false,
    contentType,
    cacheControl: "3600",
  });
  if (error) {
    if (!options?.silent) {
      toast.error("Gallery photo upload failed", { description: error.message });
    }
    throw error;
  }
  const { data } = supabase.storage.from("gallery").getPublicUrl(path);
  return data.publicUrl;
}

export type GalleryUploadProgress = {
  phase: "compressing" | "uploading" | "saving";
  done: number;
  total: number;
};

export type GalleryBatchUploadResult = {
  rows: { image_url: string; caption: string | null; sort_order: number }[];
  failed: number;
};

/** Compress and upload many gallery images in parallel, then return DB rows ready to insert. */
export async function uploadGalleryBatch(
  files: File[],
  options: {
    caption: string | null;
    baseSort: number;
    onProgress?: (progress: GalleryUploadProgress) => void;
  },
): Promise<GalleryBatchUploadResult> {
  const { caption, baseSort, onProgress } = options;
  const total = files.length;

  return withWakeLock(async () => {
    onProgress?.({ phase: "compressing", done: 0, total });
    const prepared = await compressImagesForGallery(files, (done, t) => {
      onProgress?.({ phase: "compressing", done, total: t });
    });

    let uploaded = 0;
    let failed = 0;

    onProgress?.({ phase: "uploading", done: 0, total });

    const uploadResults = await mapWithConcurrency(prepared, GALLERY_UPLOAD_CONCURRENCY, async (file, index) => {
      try {
        const url = await uploadGalleryImage(file, { silent: true, index });
        uploaded += 1;
        onProgress?.({ phase: "uploading", done: uploaded, total });
        return { ok: true as const, url, index };
      } catch {
        failed += 1;
        uploaded += 1;
        onProgress?.({ phase: "uploading", done: uploaded, total });
        return { ok: false as const, index };
      }
    });

    const rows = uploadResults
      .filter((r): r is { ok: true; url: string; index: number } => r.ok)
      .sort((a, b) => a.index - b.index)
      .map((r, i) => ({
        image_url: r.url,
        caption,
        sort_order: baseSort + i,
      }));

    onProgress?.({ phase: "saving", done: rows.length, total: rows.length });

    return { rows, failed };
  });
}

export function galleryStoragePathFromUrl(publicUrl: string): string | null {
  const marker = "/storage/v1/object/public/gallery/";
  const idx = publicUrl.indexOf(marker);
  if (idx === -1) return null;
  return decodeURIComponent(publicUrl.slice(idx + marker.length));
}

/** Remove the file from the gallery bucket. Ignores missing files. */
export async function deleteGalleryImage(publicUrl: string): Promise<void> {
  const path = galleryStoragePathFromUrl(publicUrl);
  if (!path) return;

  const { error } = await supabase.storage.from("gallery").remove([path]);
  if (error && !error.message.toLowerCase().includes("not found")) {
    throw error;
  }
}

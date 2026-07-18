import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const BUCKET = "passports";

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

export async function uploadGalleryImage(file: File): Promise<string> {
  const ext = file.name.split(".").pop() || "jpg";
  const path = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}.${ext}`;
  const { error } = await supabase.storage.from("gallery").upload(path, file, { upsert: false, contentType: file.type });
  if (error) {
    toast.error("Gallery photo upload failed", { description: error.message });
    throw error;
  }
  const { data } = supabase.storage.from("gallery").getPublicUrl(path);
  return data.publicUrl;
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

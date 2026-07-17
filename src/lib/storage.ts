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

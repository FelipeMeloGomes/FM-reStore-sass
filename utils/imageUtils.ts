// utils/imageUtils.ts
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

export async function uploadImageToSupabase(file: File, folder: string) {
  const supabase = createClientComponentClient();
  const { data, error } = await supabase.storage
    .from(folder)
    .upload(`${folder}/${file.name}`, file);

  if (error) throw new Error("Upload failed: " + error.message);
  return data;
}

export async function getPublicImageUrl(filePath: string, folder: string) {
  const supabase = createClientComponentClient();
  const {
    data: { publicUrl },
  } = await supabase.storage.from(folder).getPublicUrl(filePath);

  if (!publicUrl) throw new Error("Public URL not available");
  return publicUrl;
}

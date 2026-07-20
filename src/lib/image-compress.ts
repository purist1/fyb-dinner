const GALLERY_MAX_DIMENSION = 1920;
const GALLERY_JPEG_QUALITY = 0.82;
const SKIP_COMPRESS_BELOW_BYTES = 350_000;

/** Resize large photos before upload so multi-image batches finish quickly on slow networks. */
export async function compressImageForGallery(file: File): Promise<File> {
  if (!file.type.startsWith("image/") || file.type === "image/gif") {
    return file;
  }
  if (file.size <= SKIP_COMPRESS_BELOW_BYTES) {
    return file;
  }

  let bitmap: ImageBitmap | null = null;
  try {
    bitmap = await createImageBitmap(file);
    const maxSide = Math.max(bitmap.width, bitmap.height);
    if (maxSide <= GALLERY_MAX_DIMENSION && file.size <= 900_000) {
      return file;
    }

    const scale = Math.min(1, GALLERY_MAX_DIMENSION / maxSide);
    const width = Math.round(bitmap.width * scale);
    const height = Math.round(bitmap.height * scale);

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;

    ctx.drawImage(bitmap, 0, 0, width, height);

    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, "image/jpeg", GALLERY_JPEG_QUALITY);
    });
    if (!blob) return file;

    const baseName = file.name.replace(/\.[^.]+$/, "") || "gallery";
    return new File([blob], `${baseName}.jpg`, { type: "image/jpeg", lastModified: Date.now() });
  } catch {
    return file;
  } finally {
    bitmap?.close();
  }
}

export async function compressImagesForGallery(
  files: File[],
  onProgress?: (done: number, total: number) => void,
): Promise<File[]> {
  const total = files.length;
  let done = 0;
  const concurrency = Math.min(4, total);

  const results: File[] = new Array(total);
  let next = 0;

  async function worker() {
    while (next < total) {
      const index = next++;
      results[index] = await compressImageForGallery(files[index]);
      done += 1;
      onProgress?.(done, total);
    }
  }

  await Promise.all(Array.from({ length: concurrency }, () => worker()));
  return results;
}

/** Run async work with a small fixed pool — keeps uploads fast without overwhelming the browser. */
export async function mapWithConcurrency<T, R>(
  items: T[],
  concurrency: number,
  fn: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  if (items.length === 0) return [];

  const results: R[] = new Array(items.length);
  let next = 0;
  const workers = Math.min(concurrency, items.length);

  async function worker() {
    while (next < items.length) {
      const index = next++;
      results[index] = await fn(items[index], index);
    }
  }

  await Promise.all(Array.from({ length: workers }, () => worker()));
  return results;
}

/** Keep the screen awake during long uploads (mobile browsers). */
export async function withWakeLock<T>(fn: () => Promise<T>): Promise<T> {
  let lock: WakeLockSentinel | null = null;
  try {
    if (typeof navigator !== "undefined" && "wakeLock" in navigator) {
      lock = await navigator.wakeLock.request("screen");
    }
  } catch {
    // Wake lock unavailable or denied — uploads still proceed.
  }

  try {
    return await fn();
  } finally {
    try {
      await lock?.release();
    } catch {
      // ignore
    }
  }
}

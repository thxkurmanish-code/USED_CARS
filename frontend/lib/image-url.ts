const backendBase = process.env.NEXT_PUBLIC_API_BASE_URL
  ? process.env.NEXT_PUBLIC_API_BASE_URL.replace("/api/v1", "")
  : "http://localhost:8000";

/**
 * Converts a storage_key from the backend into a browser-loadable image URL.
 * Returns null if the image cannot be resolved (missing, broken local path, etc.)
 */
export function getImageUrl(storageKey?: string | null): string | null {
  if (!storageKey) return null;

  // Full cloud URLs — already valid
  if (storageKey.startsWith("http://") || storageKey.startsWith("https://")) {
    return storageKey;
  }

  // s3:// scheme — convert to HTTPS
  if (storageKey.startsWith("s3://")) {
    const parts = storageKey.replace("s3://", "").split("/");
    const bucket = parts[0];
    const key = parts.slice(1).join("/");
    return `https://${bucket}.s3.amazonaws.com/${key}`;
  }

  // Local development paths (e.g. /uploads/...) — resolve against backend
  if (storageKey.startsWith("/")) {
    return `${backendBase}${storageKey}`;
  }

  return `${backendBase}/${storageKey}`;
}

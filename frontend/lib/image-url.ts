const backendBase = process.env.NEXT_PUBLIC_API_BASE_URL
  ? process.env.NEXT_PUBLIC_API_BASE_URL.replace("/api/v1", "")
  : "http://localhost:8000";

const FALLBACK_CAR_IMAGE = "https://images.unsplash.com/photo-1555215695-3004980ad54e?w=800&q=80";

export function getImageUrl(storageKey?: string | null): string {
  if (!storageKey) return FALLBACK_CAR_IMAGE;
  if (storageKey.startsWith("http://") || storageKey.startsWith("https://")) {
    return storageKey;
  }
  if (storageKey.startsWith("s3://")) {
    const parts = storageKey.replace("s3://", "").split("/");
    const bucket = parts[0];
    const key = parts.slice(1).join("/");
    return `https://${bucket}.s3.amazonaws.com/${key}`;
  }
  if (storageKey.startsWith("/")) {
    return `${backendBase}${storageKey}`;
  }
  return `${backendBase}/${storageKey}`;
}


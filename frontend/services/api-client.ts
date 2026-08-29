const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000/api/v1";

export async function apiClient<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...options,
    credentials: "include",
    headers: { Accept: "application/json", ...options?.headers }
  });

  if (!response.ok) {
    throw new Error("The service could not complete your request. Please try again.");
  }

  return response.json() as Promise<T>;
}

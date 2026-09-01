function getApiBaseUrl(): string {
  const envUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (envUrl && !envUrl.includes("localhost")) {
    return envUrl;
  }
  if (typeof window !== "undefined" && !window.location.hostname.includes("localhost")) {
    return "https://used-cars-vygo.onrender.com/api/v1";
  }
  return envUrl ?? "http://localhost:8000/api/v1";
}

export async function apiClient<T>(path: string, options?: RequestInit): Promise<T> {
  let response: Response;
  const baseUrl = getApiBaseUrl();
  try {
    response = await fetch(`${baseUrl}${path}`, {

      ...options,
      credentials: "include",
      headers: { Accept: "application/json", ...options?.headers },
    });
  } catch (_netErr: unknown) {
    throw new Error("Unable to connect to server. Please check your network connection.");
  }


  if (!response.ok) {
    let errorMsg = `Server error (${response.status}). Please try again.`;
    try {
      const errJson = await response.json();
      if (errJson?.detail) {
        if (typeof errJson.detail === "string") {
          errorMsg = errJson.detail;
        } else if (Array.isArray(errJson.detail)) {
          errorMsg = errJson.detail
            .map((e: { loc?: string[]; msg: string }) => `${e.loc ? e.loc.filter((l) => l !== "body").join(".") + ": " : ""}${e.msg}`)
            .join(", ");
        }
      }
    } catch {
      if (response.status === 401) errorMsg = "Please log in to perform this action.";
      else if (response.status === 403) errorMsg = "You do not have permission for this action.";
      else if (response.status === 404) errorMsg = "The requested resource was not found.";
    }
    throw new Error(errorMsg);
  }

  if (response.status === 204) {
    return null as T;
  }

  const text = await response.text();
  if (!text) {
    return null as T;
  }

  return JSON.parse(text) as T;
}

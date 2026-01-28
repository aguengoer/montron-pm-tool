import { FORM_API_BASE_URL } from "@/lib/config";
import { getAccessToken } from "@/lib/authToken";

export async function formApiFetch<T>(path: string, options: RequestInit = {}) {
  const token = getAccessToken();

  const response = await fetch(`${FORM_API_BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers ?? {}),
    },
    credentials: options.credentials ?? "include", // Always include cookies
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Form API error ${response.status}: ${text}`);
  }

  if (response.status === 204) {
    return null as T;
  }

  return (await response.json()) as T;
}

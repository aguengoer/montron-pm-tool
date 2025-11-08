import { PM_API_BASE_URL } from "@/lib/config";
import { getAccessToken } from "@/lib/authToken";

type FetchOptions = RequestInit & { skipAuth?: boolean };

export async function pmApiFetch<T>(path: string, options: FetchOptions = {}) {
  const token = options.skipAuth ? null : getAccessToken();
  const { skipAuth, headers, ...rest } = options;

  const response = await fetch(`${PM_API_BASE_URL}${path}`, {
    ...rest,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(headers ?? {}),
    },
    credentials: "include",
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`PM API error ${response.status}: ${text}`);
  }

  if (response.status === 204) {
    return null as T;
  }

  return (await response.json()) as T;
}

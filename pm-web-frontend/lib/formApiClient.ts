import { FORM_API_BASE_URL } from "@/lib/config";

export async function formApiFetch<T>(path: string, options: RequestInit = {}) {
  const response = await fetch(`${FORM_API_BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers ?? {}),
    },
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

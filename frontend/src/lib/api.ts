import type { ApiResult } from "@/lib/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export async function fetchApi<T>(
  path: string,
  fallback: T,
  init?: RequestInit
): Promise<ApiResult<T>> {
  if (!API_URL) {
    return { data: fallback, source: "mock" };
  }

  try {
    const response = await fetch(`${API_URL}${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...init?.headers
      },
      next: { revalidate: 30 }
    });

    if (!response.ok) {
      return { data: fallback, source: "mock" };
    }

    return { data: (await response.json()) as T, source: "api" };
  } catch {
    return { data: fallback, source: "mock" };
  }
}

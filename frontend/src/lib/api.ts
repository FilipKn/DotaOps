import type { ApiResult } from "@/lib/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function unwrapBackendPayload(value: unknown) {
  if (isRecord(value) && "data" in value) {
    const data = value.data;

    if (isRecord(data) && "items" in data) {
      return data.items;
    }

    return data;
  }

  if (isRecord(value) && "items" in value) {
    return value.items;
  }

  return value;
}

function hasCompatibleShape<T>(value: unknown, fallback: T): value is T {
  if (Array.isArray(fallback)) {
    if (!Array.isArray(value)) {
      return false;
    }

    const fallbackSample = fallback[0];

    if (!isRecord(fallbackSample) || value.length === 0) {
      return true;
    }

    return value.every((item) => {
      if (!isRecord(item)) {
        return false;
      }

      return Object.keys(fallbackSample).every((key) => key in item);
    });
  }

  if (fallback === null) {
    return value === null || isRecord(value);
  }

  if (isRecord(fallback)) {
    if (!isRecord(value)) {
      return false;
    }

    return Object.keys(fallback).every((key) => key in value);
  }

  return typeof value === typeof fallback;
}

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

    const payload = unwrapBackendPayload(await response.json());

    if (!hasCompatibleShape(payload, fallback)) {
      return { data: fallback, source: "mock" };
    }

    return { data: payload, source: "api" };
  } catch {
    return { data: fallback, source: "mock" };
  }
}

import type { ApiResult } from "@/lib/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export class ApiRequestError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiRequestError";
    this.status = status;
  }
}

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

async function readJson(response: Response) {
  const text = await response.text();

  if (!text) {
    return null;
  }

  return JSON.parse(text) as unknown;
}

function apiErrorMessage(value: unknown) {
  if (isRecord(value) && typeof value.message === "string") {
    return value.message;
  }

  if (isRecord(value) && isRecord(value.error) && typeof value.error.message === "string") {
    return value.error.message;
  }

  return null;
}

function debugAuthFailure(path: string, response: Response, accessToken: string) {
  if (response.status !== 401 && response.status !== 403) {
    return;
  }

  console.warn("Authenticated API request failed.", {
    authorizationHeaderSent: Boolean(accessToken),
    path,
    status: response.status,
    tokenLength: accessToken.length
  });
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

export async function postApi<T>(path: string, body: unknown): Promise<T> {
  if (!API_URL) {
    throw new Error("Backend API URL is not configured.");
  }

  const response = await fetch(`${API_URL}${path}`, {
    body: JSON.stringify(body),
    cache: "no-store",
    credentials: "include",
    headers: {
      "Content-Type": "application/json"
    },
    method: "POST"
  });
  const rawPayload = await readJson(response);

  if (!response.ok) {
    throw new Error(apiErrorMessage(rawPayload) ?? "Backend request failed.");
  }

  return unwrapBackendPayload(rawPayload) as T;
}

export async function postApiAuthenticated<T>(
  path: string,
  body: unknown,
  accessToken: string
): Promise<T> {
  if (!API_URL) {
    throw new Error("Backend API URL is not configured.");
  }

  const response = await fetch(`${API_URL}${path}`, {
    body: JSON.stringify(body),
    cache: "no-store",
    credentials: "include",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json"
    },
    method: "POST"
  });
  const rawPayload = await readJson(response);

  if (!response.ok) {
    debugAuthFailure(path, response, accessToken);
    throw new ApiRequestError(
      apiErrorMessage(rawPayload) ?? "Authenticated backend request failed.",
      response.status
    );
  }

  return unwrapBackendPayload(rawPayload) as T;
}

export async function patchApiAuthenticated<T>(
  path: string,
  body: unknown,
  accessToken: string
): Promise<T> {
  if (!API_URL) {
    throw new Error("Backend API URL is not configured.");
  }

  const response = await fetch(`${API_URL}${path}`, {
    body: JSON.stringify(body),
    cache: "no-store",
    credentials: "include",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json"
    },
    method: "PATCH"
  });
  const rawPayload = await readJson(response);

  if (!response.ok) {
    debugAuthFailure(path, response, accessToken);
    throw new ApiRequestError(
      apiErrorMessage(rawPayload) ?? "Authenticated backend request failed.",
      response.status
    );
  }

  return unwrapBackendPayload(rawPayload) as T;
}

export async function postFormApiAuthenticated<T>(
  path: string,
  body: FormData,
  accessToken: string
): Promise<T> {
  if (!API_URL) {
    throw new Error("Backend API URL is not configured.");
  }

  const response = await fetch(`${API_URL}${path}`, {
    body,
    cache: "no-store",
    credentials: "include",
    headers: {
      Authorization: `Bearer ${accessToken}`
    },
    method: "POST"
  });
  const rawPayload = await readJson(response);

  if (!response.ok) {
    debugAuthFailure(path, response, accessToken);
    throw new ApiRequestError(
      apiErrorMessage(rawPayload) ?? "Authenticated backend request failed.",
      response.status
    );
  }

  return unwrapBackendPayload(rawPayload) as T;
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

    const payload = unwrapBackendPayload(await readJson(response));

    if (!hasCompatibleShape(payload, fallback)) {
      return { data: fallback, source: "mock" };
    }

    return { data: payload, source: "api" };
  } catch {
    return { data: fallback, source: "mock" };
  }
}

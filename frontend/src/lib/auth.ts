"use client";

import { getSupabaseBrowserClient } from "@/lib/supabase";

const API_URL = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "");
const PROFILE_SELECT_COLUMNS = [
  "avatar_url",
  "bio",
  "country_code",
  "created_at",
  "display_name",
  "nickname",
  "opendota_account_id",
  "opendota_profile_synced_at",
  "role",
  "steam_id",
  "steam_profile_synced_at",
  "updated_at"
].join(",");

export type RequestedAuthRole = "player" | "captain" | "organizer";
export type ProfileRole = RequestedAuthRole | "visitor" | "admin";

export interface LoginInput {
  email: string;
  password: string;
}

export interface RegisterInput {
  nickname: string;
  displayName: string;
  email: string;
  password: string;
  requestedRole: RequestedAuthRole;
  countryCode?: string;
  steamIdOrProfile?: string;
  bio?: string;
}

export interface AuthResult {
  dashboardPath: string;
  message?: string;
}

export interface CurrentUserProfile {
  avatarUrl: string | null;
  bio: string | null;
  countryCode: string | null;
  createdAt: string | null;
  displayName: string | null;
  email: string | null;
  nickname: string;
  opendotaAccountId: number | null;
  opendotaProfileSyncedAt: string | null;
  role: ProfileRole;
  steamId: string | null;
  steamProfileSyncedAt: string | null;
  updatedAt: string | null;
}

export interface ProfileUpdateInput {
  bio?: string;
  countryCode?: string;
  displayName?: string;
  nickname?: string;
}

export interface AvatarUploadResult {
  avatarUrl: string | null;
  message: string;
  persisted: boolean;
}

interface ProfileRow {
  avatar_url?: string | null;
  bio?: string | null;
  country_code?: string | null;
  created_at?: string | null;
  display_name?: string | null;
  nickname?: string | null;
  opendota_account_id?: number | null;
  opendota_profile_synced_at?: string | null;
  role: ProfileRole | null;
  steam_id?: string | null;
  steam_profile_synced_at?: string | null;
  updated_at?: string | null;
}

interface BackendProfileResponse {
  avatarUrl?: string | null;
  bio?: string | null;
  countryCode?: string | null;
  createdAt?: string | null;
  displayName?: string | null;
  nickname?: string | null;
  opendotaAccountId?: number | null;
  opendotaProfileSyncedAt?: string | null;
  role?: ProfileRole | null;
  steamId?: string | null;
  steamProfileSyncedAt?: string | null;
  updatedAt?: string | null;
}

class BackendRequestError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "BackendRequestError";
    this.status = status;
  }
}

function requireSupabaseClient() {
  const supabase = getSupabaseBrowserClient();

  if (!supabase) {
    throw new Error("Supabase frontend environment variables are missing.");
  }

  return supabase;
}

export function dashboardPathForRole(role?: string | null) {
  if (role === "captain" || role === "organizer" || role === "player") {
    return `/dashboard?role=${role}`;
  }

  return "/dashboard?role=player";
}

function normalizeCountryCode(value?: string) {
  const trimmed = value?.trim().toUpperCase();

  if (!trimmed) {
    return null;
  }

  return trimmed.slice(0, 2);
}

function editableProfilePayload(input: ProfileUpdateInput) {
  return {
    bio: input.bio?.trim() || null,
    country_code: normalizeCountryCode(input.countryCode),
    display_name: input.displayName?.trim() || null,
    nickname: input.nickname?.trim() || "player"
  };
}

function backendProfilePayload(input: ProfileUpdateInput) {
  return {
    bio: input.bio?.trim() || null,
    countryCode: normalizeCountryCode(input.countryCode),
    displayName: input.displayName?.trim() || null,
    nickname: input.nickname?.trim() || "player"
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

async function readJson(response: Response) {
  const text = await response.text();

  if (!text) {
    return null;
  }

  return JSON.parse(text) as unknown;
}

function unwrapApiData(value: unknown) {
  if (isRecord(value) && "data" in value) {
    return value.data;
  }

  return value;
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

function isPolicyError(value: unknown) {
  if (!isRecord(value)) {
    return false;
  }

  const code = typeof value.code === "string" ? value.code : "";
  const status = typeof value.status === "number" ? value.status : null;
  const message = typeof value.message === "string" ? value.message.toLowerCase() : "";

  return (
    status === 403 ||
    code === "42501" ||
    message.includes("row-level security") ||
    message.includes("permission denied") ||
    message.includes("violates row-level security")
  );
}

export async function getCurrentProfileRole(authUserId: string) {
  const supabase = requireSupabaseClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("role")
    .eq("auth_user_id", authUserId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  const profile = data as ProfileRow | null;

  return profile?.role ?? null;
}

function profileFromRow(row: ProfileRow | null, email: string | null): CurrentUserProfile | null {
  if (!row?.nickname) {
    return null;
  }

  return {
    avatarUrl: row.avatar_url ?? null,
    bio: row.bio ?? null,
    countryCode: row.country_code ?? null,
    createdAt: row.created_at ?? null,
    displayName: row.display_name ?? null,
    email,
    nickname: row.nickname,
    opendotaAccountId: row.opendota_account_id ?? null,
    opendotaProfileSyncedAt: row.opendota_profile_synced_at ?? null,
    role: row.role ?? "player",
    steamId: row.steam_id ?? null,
    steamProfileSyncedAt: row.steam_profile_synced_at ?? null,
    updatedAt: row.updated_at ?? null
  };
}

function profileFromBackend(
  profile: BackendProfileResponse | null,
  email: string | null
): CurrentUserProfile | null {
  if (!profile?.nickname) {
    return null;
  }

  return {
    avatarUrl: profile.avatarUrl ?? null,
    bio: profile.bio ?? null,
    countryCode: profile.countryCode ?? null,
    createdAt: profile.createdAt ?? null,
    displayName: profile.displayName ?? null,
    email,
    nickname: profile.nickname,
    opendotaAccountId: profile.opendotaAccountId ?? null,
    opendotaProfileSyncedAt: profile.opendotaProfileSyncedAt ?? null,
    role: profile.role ?? "player",
    steamId: profile.steamId ?? null,
    steamProfileSyncedAt: profile.steamProfileSyncedAt ?? null,
    updatedAt: profile.updatedAt ?? null
  };
}

export async function getCurrentUserProfile(): Promise<CurrentUserProfile | null> {
  const supabase = requireSupabaseClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();

  if (userError) {
    throw userError;
  }

  const user = userData.user;

  if (!user) {
    return null;
  }

  const { data, error } = await supabase
    .from("profiles")
    .select(PROFILE_SELECT_COLUMNS)
    .eq("auth_user_id", user.id)
    .maybeSingle();

  if (error) {
    throw error;
  }

  const profile = profileFromRow(data as ProfileRow | null, user.email ?? null);

  if (profile) {
    return profile;
  }

  const metadata = user.user_metadata ?? {};
  const requestedRole = metadata.desired_role;

  return {
    avatarUrl: null,
    bio: null,
    countryCode: null,
    createdAt: null,
    displayName: typeof metadata.display_name === "string" ? metadata.display_name : null,
    email: user.email ?? null,
    nickname:
      (typeof metadata.nickname === "string" && metadata.nickname) ||
      user.email?.split("@")[0] ||
      "player",
    opendotaAccountId: null,
    opendotaProfileSyncedAt: null,
    role:
      requestedRole === "captain" || requestedRole === "organizer" || requestedRole === "player"
        ? requestedRole
        : "player",
    steamId: null,
    steamProfileSyncedAt: null,
    updatedAt: null
  };
}

async function updateProfileViaBackend(
  input: ProfileUpdateInput,
  accessToken: string,
  email: string | null
) {
  if (!API_URL) {
    throw new Error("Backend API URL is not configured.");
  }

  const response = await fetch(`${API_URL}/me/profile`, {
    body: JSON.stringify(backendProfilePayload(input)),
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
    throw new BackendRequestError(
      apiErrorMessage(rawPayload) ?? "Backend profile update failed.",
      response.status
    );
  }

  const updatedProfile = profileFromBackend(
    unwrapApiData(rawPayload) as BackendProfileResponse | null,
    email
  );

  if (!updatedProfile) {
    throw new Error("Backend profile update returned no profile data.");
  }

  return updatedProfile;
}

async function updateProfileViaSupabase(
  input: ProfileUpdateInput,
  authUserId: string,
  email: string | null
) {
  const supabase = requireSupabaseClient();
  const { data, error } = await supabase
    .from("profiles")
    .update(editableProfilePayload(input))
    .eq("auth_user_id", authUserId)
    .select(PROFILE_SELECT_COLUMNS)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    throw new Error("Profile row was not found. Backend profile creation/update endpoint is required.");
  }

  const updatedProfile = profileFromRow(data as unknown as ProfileRow | null, email);

  if (!updatedProfile) {
    throw new Error("Profile update returned no profile data.");
  }

  return updatedProfile;
}

function profileSaveErrorMessage(backendError: unknown, supabaseError: unknown) {
  const backendMessage = backendError instanceof Error ? backendError.message : null;
  const supabaseMessage = supabaseError instanceof Error ? supabaseError.message : null;

  if (isPolicyError(supabaseError)) {
    return [
      "Profile update could not be saved.",
      "Supabase RLS blocked direct profile updates.",
      "Backend PATCH /api/me/profile must accept the current session and update nickname, displayName, countryCode and bio.",
      backendMessage ? `Backend response: ${backendMessage}` : null
    ]
      .filter(Boolean)
      .join(" ");
  }

  return [
    "Profile update could not be saved.",
    backendMessage ? `Backend response: ${backendMessage}` : null,
    supabaseMessage ? `Supabase response: ${supabaseMessage}` : null
  ]
    .filter(Boolean)
    .join(" ");
}

export async function updateCurrentUserProfile(input: ProfileUpdateInput) {
  const supabase = requireSupabaseClient();
  const [{ data: userData, error: userError }, { data: sessionData }] = await Promise.all([
    supabase.auth.getUser(),
    supabase.auth.getSession()
  ]);

  if (userError) {
    throw userError;
  }

  const user = userData.user;

  if (!user) {
    throw new Error("Login required before profile updates.");
  }

  let backendError: unknown = null;

  if (sessionData.session?.access_token && API_URL) {
    try {
      return await updateProfileViaBackend(input, sessionData.session.access_token, user.email ?? null);
    } catch (caught) {
      backendError = caught;
    }
  }

  try {
    return await updateProfileViaSupabase(input, user.id, user.email ?? null);
  } catch (supabaseError) {
    throw new Error(profileSaveErrorMessage(backendError, supabaseError));
  }
}

export async function uploadCurrentUserAvatar(file: File): Promise<AvatarUploadResult> {
  const supabase = requireSupabaseClient();
  const { data } = await supabase.auth.getSession();

  if (!API_URL || !data.session?.access_token) {
    return {
      avatarUrl: null,
      message: "Avatar preview updated locally. Backend upload endpoint is not available yet.",
      persisted: false
    };
  }

  const formData = new FormData();
  formData.append("avatar", file);

  const response = await fetch(`${API_URL}/me/avatar`, {
    body: formData,
    cache: "no-store",
    credentials: "include",
    headers: {
      Authorization: `Bearer ${data.session.access_token}`
    },
    method: "POST"
  });
  const rawPayload = await readJson(response);

  if (response.status === 404) {
    return {
      avatarUrl: null,
      message: "Avatar preview updated locally. Backend upload endpoint is not available yet.",
      persisted: false
    };
  }

  if (response.status === 401 || response.status === 403) {
    return {
      avatarUrl: null,
      message: "Avatar preview updated locally. Backend avatar upload rejected authentication.",
      persisted: false
    };
  }

  if (!response.ok) {
    throw new BackendRequestError(apiErrorMessage(rawPayload) ?? "Avatar upload failed.", response.status);
  }

  const payload = unwrapApiData(rawPayload);
  const avatarUrl =
    isRecord(payload) && typeof payload.avatarUrl === "string"
      ? payload.avatarUrl
      : isRecord(payload) && typeof payload.avatar_url === "string"
        ? payload.avatar_url
        : null;

  if (!avatarUrl) {
    return {
      avatarUrl: null,
      message: "Avatar preview updated locally. Backend upload did not return avatar_url.",
      persisted: false
    };
  }

  return {
    avatarUrl,
    message: "Avatar uploaded successfully.",
    persisted: true
  };
}

export async function signOutCurrentUser() {
  const supabase = requireSupabaseClient();
  const { error } = await supabase.auth.signOut();

  if (error) {
    throw error;
  }
}

export async function loginWithEmailPassword(input: LoginInput): Promise<AuthResult> {
  const supabase = requireSupabaseClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email: input.email,
    password: input.password
  });

  if (error) {
    throw error;
  }

  const authUserId = data.user?.id;

  if (!authUserId) {
    return {
      dashboardPath: "/dashboard?role=player",
      message: "Login completed, but no auth user id was returned."
    };
  }

  const role = await getCurrentProfileRole(authUserId);

  return {
    dashboardPath: dashboardPathForRole(role),
    message: role ? undefined : "No profile role was found; using the player dashboard fallback."
  };
}

export async function registerWithEmailPassword(input: RegisterInput): Promise<AuthResult> {
  const supabase = requireSupabaseClient();
  const { data, error } = await supabase.auth.signUp({
    email: input.email,
    password: input.password,
    options: {
      data: {
        display_name: input.displayName,
        desired_role: input.requestedRole,
        nickname: input.nickname,
        steam_id_or_profile: input.steamIdOrProfile?.trim() || null
      }
    }
  });

  if (error) {
    throw error;
  }

  if (!data.user?.id || !data.session) {
    return {
      dashboardPath: "/login",
      message: "Registration started. Check email confirmation settings, then log in."
    };
  }

  const profilePayload = {
    auth_user_id: data.user.id,
    bio: input.bio?.trim() || null,
    country_code: normalizeCountryCode(input.countryCode),
    display_name: input.displayName.trim(),
    nickname: input.nickname.trim()
  };

  const { error: profileError } = await supabase
    .from("profiles")
    .upsert(profilePayload, { onConflict: "auth_user_id" });

  if (profileError) {
    throw profileError;
  }

  await supabase.auth.signOut();

  return {
    dashboardPath: "/login",
    message:
      input.requestedRole === "player"
        ? "Account created. Log in to enter your dashboard."
        : "Account created. Log in after an admin/backend process promotes the requested role."
  };
}

"use client";

import { getSupabaseBrowserClient } from "@/lib/supabase";

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

interface ProfileRow {
  role: ProfileRole | null;
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

import crypto from "node:crypto";

import bcrypt from "bcryptjs";

import { supabase } from "../lib/supabase";

const tokenTtlHours = Number(process.env.TOKEN_TTL_HOURS) || 168;

export class AuthServiceError extends Error {
  public statusCode: number;

  public constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
  }
}

export type SafeUser = {
  id: string;
  email: string;
  createdAt: string;
};

export type AuthSession = {
  sessionId: string;
  userId: string;
};

export const normalizeEmail = (email: string): string => email.trim().toLowerCase();

export const isValidEmail = (email: string): boolean =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const hashToken = (token: string): string =>
  crypto.createHash("sha256").update(token).digest("hex");

export const registerUser = async (
  emailInput: string,
  passwordInput: string,
): Promise<SafeUser> => {
  const email = normalizeEmail(emailInput);
  const password = passwordInput.trim();
  const passwordHash = await bcrypt.hash(password, 12);

  const { data, error } = await supabase
    .from("app_users")
    .insert({
      email,
      password_hash: passwordHash,
    })
    .select("id, email, created_at")
    .single();

  if (error?.code === "23505") {
    throw new AuthServiceError(409, "Email already registered.");
  }

  if (error || !data) {
    throw new AuthServiceError(500, "Failed to register user.");
  }

  return {
    id: data.id,
    email: data.email,
    createdAt: data.created_at,
  };
};

export const loginUser = async (
  emailInput: string,
  passwordInput: string,
): Promise<{ token: string; expiresAt: string }> => {
  const email = normalizeEmail(emailInput);

  const { data: user, error: userError } = await supabase
    .from("app_users")
    .select("id, password_hash")
    .eq("email", email)
    .maybeSingle();

  if (userError) {
    throw new AuthServiceError(500, "Failed to process login.");
  }

  if (!user) {
    throw new AuthServiceError(401, "Invalid credentials.");
  }

  const passwordMatches = await bcrypt.compare(passwordInput, user.password_hash);

  if (!passwordMatches) {
    throw new AuthServiceError(401, "Invalid credentials.");
  }

  const token = crypto.randomBytes(32).toString("hex");
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + tokenTtlHours * 60 * 60 * 1000);

  const { error: sessionError } = await supabase.from("auth_sessions").insert({
    user_id: user.id,
    token_hash: tokenHash,
    expires_at: expiresAt.toISOString(),
  });

  if (sessionError) {
    throw new AuthServiceError(500, "Failed to create session.");
  }

  return {
    token,
    expiresAt: expiresAt.toISOString(),
  };
};

export const getSessionFromToken = async (
  providedToken: string,
): Promise<AuthSession> => {
  const tokenHash = hashToken(providedToken.trim());
  const nowIso = new Date().toISOString();

  const { data: session, error } = await supabase
    .from("auth_sessions")
    .select("id, user_id")
    .eq("token_hash", tokenHash)
    .is("revoked_at", null)
    .gt("expires_at", nowIso)
    .maybeSingle();

  if (error) {
    throw new AuthServiceError(500, "Failed to validate session.");
  }

  if (!session) {
    throw new AuthServiceError(401, "Invalid or expired token.");
  }

  await supabase
    .from("auth_sessions")
    .update({ last_used_at: nowIso })
    .eq("id", session.id);

  return {
    sessionId: session.id,
    userId: session.user_id,
  };
};

export const getUserById = async (userId: string): Promise<SafeUser> => {
  const { data: user, error } = await supabase
    .from("app_users")
    .select("id, email, created_at")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    throw new AuthServiceError(500, "Failed to fetch user.");
  }

  if (!user) {
    throw new AuthServiceError(404, "User not found.");
  }

  return {
    id: user.id,
    email: user.email,
    createdAt: user.created_at,
  };
};

export const logoutSession = async (sessionId: string): Promise<void> => {
  const { error } = await supabase
    .from("auth_sessions")
    .update({ revoked_at: new Date().toISOString() })
    .eq("id", sessionId);

  if (error) {
    throw new AuthServiceError(500, "Failed to log out.");
  }
};

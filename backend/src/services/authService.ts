import { createUserScopedClient, supabaseAuth } from "../lib/supabase";

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

export type AuthenticatedUser = {
  userId: string;
  email: string;
  accessToken: string;
};

export type LoginResponse = {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: string;
  user: SafeUser;
};

export const normalizeEmail = (email: string): string => email.trim().toLowerCase();

export const isValidEmail = (email: string): boolean =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const mapSafeUser = (rawUser: {
  id: string;
  email?: string;
  created_at?: string;
  createdAt?: string;
}): SafeUser => ({
  id: rawUser.id,
  email: rawUser.email ?? "",
  createdAt: rawUser.created_at ?? rawUser.createdAt ?? new Date().toISOString(),
});

export const registerUser = async (
  emailInput: string,
  passwordInput: string,
): Promise<SafeUser> => {
  const email = normalizeEmail(emailInput);
  const password = passwordInput.trim();

  const { data, error } = await supabaseAuth.auth.signUp({
    email,
    password,
  });

  if (error?.status === 400) {
    throw new AuthServiceError(400, error.message);
  }

  if (error?.status === 429) {
    throw new AuthServiceError(429, "Too many registration attempts. Try again later.");
  }

  if (error?.status === 422 || error?.status === 409) {
    throw new AuthServiceError(409, "Email already registered.");
  }

  if (data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
    throw new AuthServiceError(409, "Email already registered.");
  }

  if (error || !data.user) {
    throw new AuthServiceError(500, "Failed to register user.");
  }

  return mapSafeUser(data.user);
};

export const loginUser = async (
  emailInput: string,
  passwordInput: string,
): Promise<LoginResponse> => {
  const email = normalizeEmail(emailInput);

  const { data, error } = await supabaseAuth.auth.signInWithPassword({
    email,
    password: passwordInput,
  });

  if (error?.status === 429) {
    throw new AuthServiceError(429, "Too many login attempts. Try again later.");
  }

  if (error?.status === 400 || error?.status === 401) {
    throw new AuthServiceError(401, "Invalid credentials.");
  }

  if (error || !data.user || !data.session) {
    throw new AuthServiceError(500, "Failed to process login.");
  }

  return {
    accessToken: data.session.access_token,
    refreshToken: data.session.refresh_token,
    expiresIn: data.session.expires_in,
    tokenType: data.session.token_type,
    user: mapSafeUser(data.user),
  };
};

export const getUserFromAccessToken = async (
  accessToken: string,
): Promise<AuthenticatedUser> => {
  const userClient = createUserScopedClient(accessToken);

  const { data, error } = await userClient.auth.getUser();

  if (error?.status === 401 || error?.status === 403) {
    throw new AuthServiceError(401, "Invalid or expired token.");
  }

  if (error || !data.user || !data.user.email) {
    throw new AuthServiceError(500, "Failed to validate access token.");
  }

  return {
    userId: data.user.id,
    email: data.user.email,
    accessToken,
  };
};

export const logoutCurrentSession = async (accessToken: string): Promise<void> => {
  const userClient = createUserScopedClient(accessToken);
  const { error } = await userClient.auth.signOut();

  if (error?.status === 401 || error?.status === 403) {
    throw new AuthServiceError(401, "Invalid or expired token.");
  }

  if (error) {
    throw new AuthServiceError(500, "Failed to log out.");
  }
};

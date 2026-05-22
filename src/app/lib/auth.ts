const API_BASE = import.meta.env.VITE_API_URL ?? "http://127.0.0.1:8000/api";

const TOKEN_KEY = "auth_token";
const ROLE_KEY = "auth_role";
const USER_KEY = "auth_user";

export type UserRole = "mentee" | "mentor" | "admin";

export type MentorStatus = "pending" | "approved" | "rejected";

export type AuthUser = {
  id: number;
  username: string;
  email: string;
  role: UserRole;
  mentor_status?: MentorStatus | null;
};

export function getDashboardPath(user: AuthUser): string {
  if (user.role === "admin") return "/admin-dashboard";
  if (user.role === "mentor") {
    if (user.mentor_status === "pending") return "/mentor-pending";
    if (user.mentor_status === "rejected") return "/login";
    return "/mentor-dashboard";
  }
  return "/mentee-dashboard";
}

type AuthResponse = {
  token: string;
  user: AuthUser;
};

export type RegisterResponse = {
  detail: string;
  email: string;
  requires_verification: boolean;
};

export type VerifyEmailResponse = {
  detail: string;
  token?: string;
  user?: AuthUser;
  already_verified?: boolean;
};

function extractErrorMessage(payload: unknown): string {
  if (!payload || typeof payload !== "object") {
    return "Something went wrong.";
  }

  const data = payload as Record<string, unknown>;
  if (typeof data.detail === "string") {
    return data.detail;
  }
  if (data.requires_verification === true && typeof data.email === "string") {
    return data.detail as string;
  }

  const firstValue = Object.values(data)[0];
  if (Array.isArray(firstValue) && typeof firstValue[0] === "string") {
    return firstValue[0];
  }

  return "Something went wrong.";
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(extractErrorMessage(payload));
  }
  return payload as T;
}

export function getAuthToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setAuthToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearAuth(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(ROLE_KEY);
  localStorage.removeItem(USER_KEY);
}

function isUserRole(value: unknown): value is UserRole {
  return value === "mentee" || value === "mentor" || value === "admin";
}

export function setAuthRole(role: UserRole): void {
  localStorage.setItem(ROLE_KEY, role);
}

export function getAuthRole(): UserRole | null {
  const role = localStorage.getItem(ROLE_KEY);
  return isUserRole(role) ? role : null;
}

export function setAuthUser(user: AuthUser): void {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function getAuthUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object") return null;
    const u = parsed as Record<string, unknown>;
    if (
      typeof u.id === "number" &&
      typeof u.username === "string" &&
      typeof u.email === "string" &&
      isUserRole(u.role)
    ) {
      const ms = u.mentor_status;
      const mentor_status =
        ms === "pending" || ms === "approved" || ms === "rejected" ? ms : null;
      return {
        id: u.id,
        username: u.username,
        email: u.email,
        role: u.role,
        mentor_status,
      };
    }
    return null;
  } catch {
    return null;
  }
}

export async function register(payload: {
  email: string;
  password: string;
  role: "mentee" | "mentor";
  firstName?: string;
  lastName?: string;
}): Promise<RegisterResponse> {
  return request<RegisterResponse>("/auth/register/", {
    method: "POST",
    body: JSON.stringify({
      username: payload.email,
      email: payload.email,
      password: payload.password,
      role: payload.role,
      first_name: payload.firstName ?? "",
      last_name: payload.lastName ?? "",
    }),
  });
}

export async function verifyEmail(token: string): Promise<VerifyEmailResponse> {
  return request<VerifyEmailResponse>("/auth/verify-email/", {
    method: "POST",
    body: JSON.stringify({ token }),
  });
}

export async function resendVerificationEmail(email: string): Promise<{ detail: string }> {
  return request<{ detail: string }>("/auth/resend-verification/", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

export async function requestPasswordReset(email: string): Promise<{ detail: string }> {
  return request<{ detail: string }>("/auth/password-reset/", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

export async function confirmPasswordReset(
  token: string,
  password: string,
): Promise<{ detail: string }> {
  return request<{ detail: string }>("/auth/password-reset/confirm/", {
    method: "POST",
    body: JSON.stringify({ token, password }),
  });
}

export class EmailNotVerifiedError extends Error {
  email: string;

  constructor(message: string, email: string) {
    super(message);
    this.name = "EmailNotVerifiedError";
    this.email = email;
  }
}

export async function login(payload: {
  email: string;
  password: string;
}): Promise<AuthResponse> {
  const response = await fetch(`${API_BASE}/auth/login/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      username: payload.email,
      password: payload.password,
    }),
  });

  const data = (await response.json().catch(() => ({}))) as Record<string, unknown>;
  if (!response.ok) {
    if (
      response.status === 403 &&
      data.requires_verification === true &&
      typeof data.email === "string"
    ) {
      throw new EmailNotVerifiedError(
        typeof data.detail === "string" ? data.detail : "Please verify your email before signing in.",
        data.email,
      );
    }
    throw new Error(extractErrorMessage(data));
  }
  return data as AuthResponse;
}

export async function authFetch(path: string, init?: RequestInit): Promise<Response> {
  const token = getAuthToken();
  return fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      ...(init?.headers ?? {}),
      ...(token ? { Authorization: `Token ${token}` } : {}),
    },
  });
}

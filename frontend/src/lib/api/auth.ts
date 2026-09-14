import { apiFetch } from "./client";
import type { AuthTokens, RegisterResponse, User, UserType } from "./types";

export interface RegisterPayload {
  username: string;
  email: string;
  password: string;
  password2: string;
  phone_number?: string;
  user_type?: Extract<UserType, "citizen" | "business">;
}

export function login(username: string, password: string): Promise<AuthTokens> {
  return apiFetch<AuthTokens>("/auth/login/", {
    method: "POST",
    body: { username, password },
  });
}

export function register(payload: RegisterPayload): Promise<RegisterResponse> {
  return apiFetch<RegisterResponse>("/auth/register/", {
    method: "POST",
    body: payload,
  });
}

export function fetchMe(): Promise<User> {
  return apiFetch<User>("/users/me/");
}

export type UpdateProfilePayload = Partial<
  Pick<User, "email" | "first_name" | "last_name" | "phone_number">
>;

export function updateMe(payload: UpdateProfilePayload): Promise<User> {
  return apiFetch<User>("/users/me/", {
    method: "PATCH",
    body: payload,
  });
}

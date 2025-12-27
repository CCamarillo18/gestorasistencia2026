import { supabase } from "./supabase";
import { API_BASE } from "./config";

export async function apiFetch(input: RequestInfo | URL, init: RequestInit = {}) {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  const headers = new Headers(init.headers || {});
  if (token) headers.set("Authorization", `Bearer ${token}`);
  let url: RequestInfo | URL = input;
  if (typeof input === "string") {
    url = input.startsWith("http")
      ? input
      : new URL(input, API_BASE).toString();
  }
  return fetch(url, { ...init, headers });
}

import { supabase } from "./supabase";
import { API_BASE } from "./config";

export async function apiFetch(input: RequestInfo | URL, init: RequestInit = {}) {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  const headers = new Headers(init.headers || {});
  if (token) headers.set("Authorization", `Bearer ${token}`);
  let url: RequestInfo | URL = input;
  if (typeof input === "string") {
    const normalized = input.startsWith("/api/") ? input.replace(/^\/api\//, "/") : input;
    url = normalized.startsWith("http")
      ? normalized
      : new URL(normalized, API_BASE).toString();
  }
  const res = await fetch(url, { ...init, headers });
  if (!res.ok) {
    console.error("API error", { url, status: res.status, statusText: res.statusText });
  }
  return res;
}

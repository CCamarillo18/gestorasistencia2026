const RAW = import.meta.env.VITE_API_BASE_URL;
if (!RAW) {
  console.warn("VITE_API_BASE_URL no está definido; usando origen relativo /api");
}
export const API_BASE = RAW ? RAW.replace(/\/+$/, "").replace(/\/api$/i, "") : `${window.location.origin}/api`;
const SITE_RAW = import.meta.env.VITE_SITE_URL;
export const SITE_URL = SITE_RAW ? SITE_RAW.replace(/\/+$/, "") : window.location.origin;

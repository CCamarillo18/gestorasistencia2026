import { Link, useNavigate } from "react-router";
import { LogOut, GraduationCap } from "lucide-react";
import { supabase } from "@/react-app/lib/supabase";
import { useEffect, useState } from "react";
import { apiFetch } from "@/react-app/lib/api";

export default function Navbar() {
  const [name, setName] = useState<string | null>(null);
  const [avatar, setAvatar] = useState<string | null>(null);
  const [activeYear, setActiveYear] = useState<number | null>(null);
  const [termsCount, setTermsCount] = useState<number | null>(null);
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      const u = data.user;
      setName(u?.user_metadata?.name || u?.email || null);
      setAvatar(u?.user_metadata?.avatar_url || null);
    });
    apiFetch("/api/admin/settings")
      .then((r) => r.ok ? r.json() : null)
      .then((d) => {
        if (d) {
          setActiveYear(d.active_year);
          setTermsCount(d.terms_count);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const handler = (e: any) => {
      const d = e.detail || {};
      if (typeof d.active_year === "number") setActiveYear(d.active_year);
      if (typeof d.terms_count === "number") setTermsCount(d.terms_count);
    };
    window.addEventListener("settings-updated", handler as any);
    return () => window.removeEventListener("settings-updated", handler as any);
  }, []);

  return (
    <nav className="bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center space-x-8">
            <Link to="/dashboard" className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center shadow-lg">
                <GraduationCap className="w-6 h-6 text-white" />
              </div>
              {activeYear !== null && (
                <span className="px-3 py-1 rounded-xl bg-slate-100 text-slate-800 text-xs font-semibold">
                  Año lectivo: {activeYear}{termsCount ? ` · ${termsCount} periodos` : ""}
                </span>
              )}
            </Link>
            <Link
              to="/students"
              className="px-3 py-1 rounded-full bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 transition-colors"
            >
              Estudiantes
            </Link>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3">
              {avatar && (
                <img
                  src={avatar}
                  alt="Profile"
                  className="w-8 h-8 rounded-full border-2 border-indigo-200"
                />
              )}
              <div className="hidden sm:block text-right">
                <p className="text-sm font-medium text-gray-900">
                  {name}
                </p>
                <p className="text-xs text-gray-500">Profesor</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center space-x-2 px-3 py-2 rounded-lg text-gray-700 hover:bg-red-50 hover:text-red-600 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Salir</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}

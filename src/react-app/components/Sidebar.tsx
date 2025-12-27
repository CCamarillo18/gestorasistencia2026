import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router";
import {
  LayoutDashboard,
  ClipboardCheck,
  Users,
  Bell,
  CalendarDays,
  Cog,
  GraduationCap,
  Megaphone,
  BookOpen,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

const items = [
  { key: "dashboard", label: "Dashboard", icon: LayoutDashboard, path: "/dashboard" },
  { key: "attendance", label: "Mis Clases", icon: ClipboardCheck, path: "/dashboard" },
  { key: "students", label: "Estudiantes", icon: Users, path: "/students" },
  { key: "absences", label: "Ausencias", icon: Bell, path: "/school-absences" },
  { key: "calendar", label: "Calendario", icon: CalendarDays, path: "/calendar" },
  { key: "board", label: "Pizarra", icon: Megaphone, path: "/board" },
  { key: "reports", label: "Reportes", icon: BookOpen, path: "/reports" },
  { key: "teachers", label: "Docentes", icon: GraduationCap, path: "/teachers" },
  { key: "admin", label: "Admin", icon: Cog, path: "/admin" },
];

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState<boolean>(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const saved = localStorage.getItem("sidebar_collapsed");
    if (saved) setCollapsed(saved === "1");
  }, []);

  const toggle = () => {
    const next = !collapsed;
    setCollapsed(next);
    localStorage.setItem("sidebar_collapsed", next ? "1" : "0");
  };

  return (
    <aside
      className={`bg-[#0F2C81] text-white flex flex-col justify-between ${
        collapsed ? "w-20" : "w-64"
      } transition-all duration-300 rounded-r-[3rem]`}
    >
      <div className="p-4">
        <div className={`flex items-center ${collapsed ? "justify-center" : "justify-between"} mb-6`}>
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center font-black">ES</div>
            {!collapsed && (
              <div>
                <p className="text-sm opacity-90">IED Eduardo Santos</p>
                <p className="text-xs opacity-75">La Playa</p>
              </div>
            )}
          </div>
          {!collapsed && (
            <button onClick={toggle} className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition">
              <ChevronLeft className="w-4 h-4" />
            </button>
          )}
          {collapsed && (
            <button onClick={toggle} className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition">
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
        <nav className="space-y-1">
          {items.map((it) => {
            const active = location.pathname.startsWith(it.path);
            const Icon = it.icon;
            return (
              <button
                key={it.key}
                onClick={() => navigate(it.path)}
                className={`w-full flex items-center ${
                  collapsed ? "justify-center" : "justify-start"
                } space-x-3 px-3 py-3 rounded-2xl transition ${
                  active ? "bg-white text-[#0F2C81]" : "hover:bg-white/10"
                }`}
              >
                <Icon className={`w-5 h-5 ${active ? "" : "opacity-90"}`} />
                {!collapsed && <span className="text-sm font-medium">{it.label}</span>}
              </button>
            );
          })}
        </nav>
      </div>
      <div className="p-4">
        <div className={`flex items-center ${collapsed ? "justify-center" : "justify-between"} gap-3`}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center font-bold">CC</div>
            {!collapsed && (
              <div className="text-xs">
                <p className="font-semibold">Carlos Camarillo</p>
                <p className="opacity-75">Administrador</p>
              </div>
            )}
          </div>
          {!collapsed && (
            <button
              onClick={() => navigate("/logout")}
              className="px-3 py-2 text-xs rounded-xl bg-white/10 hover:bg-white/20 transition"
            >
              Cerrar sesión
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}


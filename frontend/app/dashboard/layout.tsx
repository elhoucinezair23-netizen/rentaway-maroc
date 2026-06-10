"use client";

import { useEffect, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard,
  Car,
  CalendarDays,
  BarChart2,
  MessageSquare,
  Users,
  Building2,
  ShieldAlert,
  Download,
  Target,
  Camera,
  Mail,
  BookOpen,
  UserCircle,
  LogOut,
  Menu,
  X,
  ChevronRight,
} from "lucide-react";
import { useNotifications } from "@/hooks/useNotifications";

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}

const clientNav: NavItem[] = [
  { label: "Mes réservations", href: "/dashboard/client/reservations", icon: <BookOpen size={18} /> },
  { label: "Messages", href: "/dashboard/client/messages", icon: <MessageSquare size={18} /> },
  { label: "Profil", href: "/dashboard/client/profile", icon: <UserCircle size={18} /> },
];

const agencyNav: NavItem[] = [
  { label: "Tableau de bord", href: "/dashboard/agency", icon: <LayoutDashboard size={18} /> },
  { label: "Mon parc", href: "/dashboard/agency/vehicles", icon: <Car size={18} /> },
  { label: "Réservations", href: "/dashboard/agency/reservations", icon: <BookOpen size={18} /> },
  { label: "Calendrier", href: "/dashboard/agency/calendar", icon: <CalendarDays size={18} /> },
  { label: "Statistiques", href: "/dashboard/agency/stats", icon: <BarChart2 size={18} /> },
  { label: "Messages", href: "/dashboard/agency/messages", icon: <MessageSquare size={18} /> },
];

const adminNav: NavItem[] = [
  { label: "Tableau de bord", href: "/dashboard/admin", icon: <LayoutDashboard size={18} /> },
  { label: "Agences", href: "/dashboard/admin/agencies", icon: <Building2 size={18} /> },
  { label: "Prospection", href: "/dashboard/admin/prospection", icon: <Target size={18} /> },
  { label: "Véhicules scrapés", href: "/dashboard/admin/scraped-vehicles", icon: <Camera size={18} /> },
  { label: "Emails", href: "/dashboard/admin/emails", icon: <Mail size={18} /> },
  { label: "Litiges", href: "/dashboard/admin/disputes", icon: <ShieldAlert size={18} /> },
  { label: "Utilisateurs", href: "/dashboard/admin/users", icon: <Users size={18} /> },
  { label: "Export", href: "/dashboard/admin/export", icon: <Download size={18} /> },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Connexion Socket.IO + toast sur "notification"
  useNotifications();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login");
    }
  }, [status, router]);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!session) return null;

  const role = (session.user as { role?: string })?.role;
  let navItems: NavItem[] = [];
  if (role === "CLIENT") navItems = clientNav;
  else if (role === "LOUEUR") navItems = agencyNav;
  else if (role === "ADMIN") navItems = adminNav;

  const user = session.user as {
    name?: string | null;
    email?: string | null;
    image?: string | null;
    role?: string;
  };

  const initials = user.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "U";

  const Sidebar = () => (
    <aside className="flex flex-col h-full bg-gray-900 text-white w-64">
      {/* Logo RentaWay */}
      <Link href="/" className="block px-6 py-5 border-b border-gray-700 hover:bg-gray-800/40 transition-colors">
        <div className="bg-white inline-block rounded-lg p-1.5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.svg" alt="RentaWay Maroc" className="h-8 w-auto" />
        </div>
      </Link>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const active = pathname === item.href || (item.href !== "/dashboard/agency" && item.href !== "/dashboard/admin" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                active
                  ? "bg-blue-600 text-white"
                  : "text-gray-300 hover:bg-gray-800 hover:text-white"
              }`}
            >
              {item.icon}
              {item.label}
              {active && <ChevronRight size={14} className="ml-auto" />}
            </Link>
          );
        })}
      </nav>

      {/* User + Logout */}
      <div className="px-3 py-4 border-t border-gray-700">
        <div className="flex items-center gap-3 px-3 py-2 rounded-lg mb-2">
          <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-xs font-bold flex-shrink-0">
            {initials}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-white truncate">{user.name ?? "Utilisateur"}</p>
            <p className="text-xs text-gray-400 truncate">{user.email ?? ""}</p>
          </div>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
        >
          <LogOut size={18} />
          Déconnexion
        </button>
      </div>
    </aside>
  );

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Desktop sidebar */}
      <div className="hidden lg:flex lg:flex-shrink-0">
        <div className="w-64 flex flex-col">
          <Sidebar />
        </div>
      </div>

      {/* Mobile sidebar drawer */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setSidebarOpen(false)}
          />
          <div className="absolute left-0 top-0 h-full w-64 z-50">
            <Sidebar />
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-4 sticky top-0 z-30">
          <button
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu size={20} />
          </button>

          <div className="flex-1" />

          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-gray-900">{user.name ?? "Utilisateur"}</p>
              <p className="text-xs text-gray-500 capitalize">
                {role === "LOUEUR" ? "Agence" : role === "ADMIN" ? "Administrateur" : "Client"}
              </p>
            </div>
            <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-bold">
              {initials}
            </div>
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-500 hover:text-gray-700"
              title="Déconnexion"
            >
              <LogOut size={18} />
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}

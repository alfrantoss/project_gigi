"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Home,
  Wallet,
  Users,
  FileText,
  Calendar,
  Bell,
  Settings,
  LogOut,
  BarChart3,
  Receipt,
} from "lucide-react";
import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";

interface SidebarProps {
  role: string;
}

const menuItems = {
  SUPER_ADMIN: [
    { icon: Home, label: "Dashboard", href: "/dashboard" },
    { icon: Wallet, label: "Keuangan", href: "/dashboard/transactions" },
    { icon: Receipt, label: "Pembayaran", href: "/dashboard/payments" },
    {
      icon: Receipt,
      label: "Buat Tagihan",
      href: "/dashboard/payments/generate",
    },
    { icon: Users, label: "Data Warga", href: "/dashboard/warga" },
    { icon: FileText, label: "Penyuratan", href: "/dashboard/surat" },
    { icon: Calendar, label: "Kegiatan", href: "/dashboard/activities" },
    { icon: Bell, label: "Pengumuman", href: "/dashboard/announcements" },
    { icon: BarChart3, label: "Laporan", href: "/dashboard/reports" },
    { icon: Settings, label: "Pengaturan", href: "/dashboard/settings" },
  ],
  KETUA_RT: [
    { icon: Home, label: "Dashboard", href: "/dashboard" },
    { icon: Wallet, label: "Keuangan", href: "/dashboard/transactions" },
    { icon: Receipt, label: "Pembayaran", href: "/dashboard/payments" },
    {
      icon: Receipt,
      label: "Buat Tagihan",
      href: "/dashboard/payments/generate",
    },
    { icon: Users, label: "Data Warga", href: "/dashboard/warga" },
    { icon: FileText, label: "Penyuratan", href: "/dashboard/surat" },
    { icon: Calendar, label: "Kegiatan", href: "/dashboard/activities" },
    { icon: Bell, label: "Pengumuman", href: "/dashboard/announcements" },
    { icon: BarChart3, label: "Laporan", href: "/dashboard/reports" },
  ],
  BENDAHARA: [
    { icon: Home, label: "Dashboard", href: "/dashboard" },
    { icon: Wallet, label: "Keuangan", href: "/dashboard/transactions" },
    { icon: Receipt, label: "Pembayaran", href: "/dashboard/payments" },
    {
      icon: Receipt,
      label: "Buat Tagihan",
      href: "/dashboard/payments/generate",
    },
    { icon: Users, label: "Data Warga", href: "/dashboard/warga" },
    { icon: BarChart3, label: "Laporan", href: "/dashboard/reports" },
  ],
  WARGA: [
    { icon: Home, label: "Dashboard", href: "/dashboard" },
    { icon: Receipt, label: "Tagihan Saya", href: "/dashboard/payments" },
    { icon: FileText, label: "Pengajuan Surat", href: "/dashboard/surat" },
    {
      icon: Calendar,
      label: "Kalender Kegiatan",
      href: "/dashboard/activities",
    },
    { icon: Bell, label: "Pengumuman", href: "/dashboard/announcements" },
  ],
};

export function Sidebar({ role }: SidebarProps) {
  const pathname = usePathname();
  const items = menuItems[role as keyof typeof menuItems] || menuItems.WARGA;

  return (
    <div className="flex flex-col h-full bg-slate-900 text-white">
      <div className="p-6 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white rounded-lg">
            <Home className="h-6 w-6 text-slate-900" />
          </div>
          <div>
            <h1 className="font-bold text-lg">Sistem Manajemen Warga</h1>
            <p className="text-xs text-slate-400">Pesona Gading Cibitung 1</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-lg transition-all",
                isActive
                  ? "bg-white text-slate-900 font-medium"
                  : "text-slate-300 hover:bg-slate-800 hover:text-white",
              )}
            >
              <Icon className="h-5 w-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-800">
        <Button
          variant="ghost"
          className="w-full justify-start text-slate-300 hover:bg-slate-800 hover:text-white"
          onClick={() => signOut({ callbackUrl: "/auth/login" })}
        >
          <LogOut className="h-5 w-5 mr-3" />
          Keluar
        </Button>
      </div>
    </div>
  );
}

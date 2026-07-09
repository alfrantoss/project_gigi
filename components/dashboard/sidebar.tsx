"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
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
  id?: string;
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

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.04,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, x: -15 },
  show: { 
    opacity: 1, 
    x: 0, 
    transition: { 
      stiffness: 140, 
      damping: 16 
    } 
  },
};

export function Sidebar({ role, id = "desktop" }: SidebarProps) {
  const pathname = usePathname();
  const items = menuItems[role as keyof typeof menuItems] || menuItems.WARGA;

  return (
    <div className="flex flex-col h-full bg-[#1C2F57] text-white">
      <div className="p-6 border-b border-white/10">
        <div className="flex flex-col items-center text-center gap-4">
          <motion.div 
            className="h-20 w-20 rounded-xl overflow-hidden bg-white flex items-center justify-center flex-shrink-0 shadow-md cursor-pointer border-2 border-[#B59A5A]"
            whileHover={{ 
              scale: 1.08,
              boxShadow: "0 10px 25px -5px rgba(0,0,0,0.3), 0 8px 10px -6px rgba(0,0,0,0.3)"
            }}
            transition={{ type: "spring", stiffness: 300, damping: 15 }}
          >
            {/* Silakan simpan foto/logo Anda di folder public/ dengan nama logo.png (atau sesuaikan ekstensinya) */}
            <img 
              src="/logo.png" 
              alt="Logo" 
              className="h-full w-full object-cover"
              onError={(e) => {
                // Fallback jika file gambar belum ada atau salah nama
                e.currentTarget.style.display = 'none';
                if (e.currentTarget.parentElement) {
                  e.currentTarget.parentElement.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-10 w-10 text-slate-900"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>';
                }
              }}
            />
          </motion.div>
          <motion.div 
            className="space-y-1"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <h1 className="font-bold text-base tracking-wide leading-snug">Sistem Manajemen Warga</h1>
            <p className="text-xs text-white font-semibold tracking-wider uppercase">Pesona Gading Cibitung 1</p>
          </motion.div>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-white/20 [&::-webkit-scrollbar-thumb]:bg-white/70 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:hover:bg-white/90">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="space-y-1"
        >
          {items.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <motion.div
                key={item.href}
                variants={itemVariants}
                whileHover={{ x: 4 }}
                whileTap={{ scale: 0.98 }}
              >
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-lg transition-all relative z-0 group",
                    isActive
                      ? "text-slate-900 font-bold"
                      : "text-white hover:text-white",
                  )}
                >
                  {isActive && (
                    <>
                      <motion.div
                        layoutId={`active-pill-${id}`}
                        className="absolute inset-0 bg-white rounded-lg -z-10 shadow-sm"
                        transition={{ type: "spring", stiffness: 350, damping: 30 }}
                      />
                      <motion.div
                        layoutId={`active-line-${id}`}
                        className="absolute left-1.5 top-3.5 bottom-3.5 w-1 bg-slate-900 rounded-full"
                        transition={{ type: "spring", stiffness: 350, damping: 30 }}
                      />
                    </>
                  )}
                  
                  {!isActive && (
                    <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg -z-10" />
                  )}

                  <Icon className={cn(
                    "h-5 w-5 transition-transform duration-200 group-hover:scale-110",
                    isActive ? "text-slate-900" : "text-white group-hover:text-white"
                  )} />
                  <span>{item.label}</span>
                </Link>
              </motion.div>
            );
          })}
        </motion.div>
      </nav>

      <div className="p-4 border-t border-white/10">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Button
            variant="ghost"
            className="w-full justify-start text-white hover:bg-white/10 hover:text-white"
            onClick={() => signOut({ callbackUrl: "/auth/login" })}
          >
            <LogOut className="h-5 w-5 mr-3 text-white" />
            Keluar
          </Button>
        </motion.div>
      </div>
    </div>
  );
}

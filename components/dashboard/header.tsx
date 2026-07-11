"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell, Menu, Check, Clock, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { signOut } from "next-auth/react";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import "dayjs/locale/id";

dayjs.extend(relativeTime);
dayjs.locale("id");

interface Notification {
  id: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  type: string;
}

interface HeaderProps {
  user: {
    name: string;
    email: string;
    role: string;
  };
  onMenuClick?: () => void;
}

const roleLabels = {
  SUPER_ADMIN: "Super Admin",
  KETUA_RT: "Ketua RT",
  BENDAHARA: "Bendahara",
  WARGA: "Warga",
};

export function Header({ user, onMenuClick }: HeaderProps) {
  const router = useRouter();
  const initials = user.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
    // Refresh notifications every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchNotifications = async () => {
    try {
      const response = await fetch("/api/notifications?limit=5");
      if (!response.ok) {
        setNotifications([]);
        setUnreadCount(0);
        return;
      }
      const data = await response.json();
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
      setNotifications([]);
      setUnreadCount(0);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      await fetch("/api/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationId }),
      });
      fetchNotifications();
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await fetch("/api/notifications?markAsRead=true");
      fetchNotifications();
    } catch (error) {
      console.error("Failed to mark all as read:", error);
    }
  };

  const getNotificationUrl = (notif: Notification): string => {
    // Redirect berdasarkan tipe notifikasi
    switch (notif.type) {
      case 'PAYMENT_SUCCESS':
      case 'PAYMENT_PENDING':
      case 'PAYMENT_REMINDER':
        return '/dashboard/payments';
      
      case 'SURAT_SUBMITTED':
      case 'SURAT_APPROVED':
      case 'SURAT_REJECTED':
        return '/dashboard/surat';
      
      case 'ANNOUNCEMENT':
        return '/dashboard/announcements';
      
      case 'ACTIVITY':
        return '/dashboard/activities';
      
      default:
        return '/dashboard';
    }
  };

  const handleNotificationClick = async (notif: Notification) => {
    // Mark as read jika belum dibaca
    if (!notif.isRead) {
      await markAsRead(notif.id);
    }
    // Redirect ke halaman terkait
    const url = getNotificationUrl(notif);
    router.push(url);
  };

  return (
    <header className="h-16 border-b bg-white flex items-center justify-between px-6">
      <div className="flex items-center gap-4">
        {onMenuClick && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onMenuClick}
            className="lg:hidden"
          >
            <Menu className="h-5 w-5" />
          </Button>
        )}
        <div>
          <h2 className="text-sm font-medium text-slate-900">{user.name}</h2>
          <p className="text-xs text-slate-500">
            {roleLabels[user.role as keyof typeof roleLabels]}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 h-5 w-5 bg-red-500 rounded-full text-white text-xs flex items-center justify-center font-bold">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <div className="flex items-center justify-between px-4 py-2">
              <DropdownMenuLabel>Notifikasi</DropdownMenuLabel>
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs h-6"
                  onClick={markAllAsRead}
                >
                  Tandai semua dibaca
                </Button>
              )}
            </div>
            <DropdownMenuSeparator />
            {loading ? (
              <div className="p-4 text-center text-sm text-slate-500">
                Loading...
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-4 text-center text-sm text-slate-500">
                Tidak ada notifikasi
              </div>
            ) : (
              <div className="max-h-96 overflow-y-auto">
                {notifications.map((notif) => (
                  <DropdownMenuItem
                    key={notif.id}
                    className="flex items-start gap-3 p-4 cursor-pointer hover:bg-slate-50 border-b"
                    onClick={() => handleNotificationClick(notif)}
                  >
                    <div className="flex-1 min-w-0">
                      <p
                        className={`text-sm font-medium ${notif.isRead ? "text-slate-500" : "text-slate-900"}`}
                      >
                        {notif.title}
                      </p>
                      <p
                        className={`text-xs line-clamp-2 ${notif.isRead ? "text-slate-400" : "text-slate-600"}`}
                      >
                        {notif.message}
                      </p>
                      <p className="text-xs text-slate-400 mt-1">
                        {dayjs(notif.createdAt).fromNow()}
                      </p>
                    </div>
                    {!notif.isRead && (
                      <Clock className="h-3 w-3 text-blue-500 mt-1 flex-shrink-0" />
                    )}
                    {notif.isRead && (
                      <Check className="h-3 w-3 text-slate-400 mt-1 flex-shrink-0" />
                    )}
                  </DropdownMenuItem>
                ))}
              </div>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-10 w-10 rounded-full">
              <Avatar>
                <AvatarFallback className="bg-slate-900 text-white">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium">{user.name}</p>
                <p className="text-xs text-slate-500">{user.email}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/dashboard/profile/me">Profil Saya</Link>
            </DropdownMenuItem>
            {["SUPER_ADMIN", "KETUA_RT", "BENDAHARA"].includes(user.role) && (
              <>
                <DropdownMenuItem asChild>
                  <Link href="/dashboard/settings">Pengaturan</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
              </>
            )}
            <DropdownMenuItem
              className="text-red-600 cursor-pointer"
              onClick={() => signOut({ callbackUrl: "/auth/login" })}
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}

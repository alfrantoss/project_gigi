"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Bell,
  Plus,
  AlertCircle,
  Info,
  Edit2,
  Trash2,
  Loader2,
} from "lucide-react";
import dayjs from "dayjs";
import "dayjs/locale/id";

dayjs.locale("id");

const priorityConfig = {
  high: {
    icon: AlertCircle,
    color: "bg-red-100 text-red-800",
    label: "Penting",
  },
  normal: {
    icon: Info,
    color: "bg-blue-100 text-blue-800",
    label: "Normal",
  },
  low: {
    icon: Bell,
    color: "bg-gray-100 text-gray-800",
    label: "Biasa",
  },
};

export default function AnnouncementsPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const { toast } = useToast();
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    id: string;
    title: string;
  }>({
    open: false,
    id: "",
    title: "",
  });

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    try {
      const response = await fetch("/api/announcements?isActive=true");
      const data = await response.json();
      setAnnouncements(data.announcements);
    } catch (error) {
      console.error("Failed to fetch announcements:", error);
      toast({
        title: "Error",
        description: "Gagal memuat pengumuman",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      setDeleting(deleteDialog.id);

      const response = await fetch(`/api/announcements/${deleteDialog.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete announcement");
      }

      toast({ title: "Sukses", description: "Pengumuman berhasil dihapus" });
      setAnnouncements(announcements.filter((a) => a.id !== deleteDialog.id));
      setDeleteDialog({ open: false, id: "", title: "" });
    } catch (error) {
      console.error("Delete announcement error:", error);
      toast({
        title: "Error",
        description: "Gagal menghapus pengumuman",
        variant: "destructive",
      });
    } finally {
      setDeleting(null);
    }
  };

  const canManage = ["SUPER_ADMIN", "KETUA_RT"].includes(
    session?.user?.role || "",
  );
  const canDelete = session?.user?.role === "SUPER_ADMIN";

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-12 w-12 animate-spin text-slate-900" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Pengumuman</h1>
          <p className="text-slate-600 mt-1">
            Informasi dan pengumuman penting RT
          </p>
        </div>
        {canManage && (
          <Button
            onClick={() => router.push("/dashboard/announcements/create")}
          >
            <Plus className="h-4 w-4 mr-2" />
            Buat Pengumuman
          </Button>
        )}
      </div>

      <div className="space-y-4">
        {announcements.map((announcement) => {
          const priority =
            priorityConfig[
              announcement.priority as keyof typeof priorityConfig
            ];
          const Icon = priority.icon;

          return (
            <Card
              key={announcement.id}
              className={`border-l-4 ${
                announcement.priority === "high"
                  ? "border-red-500"
                  : announcement.priority === "normal"
                    ? "border-blue-500"
                    : "border-gray-500"
              }`}
            >
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3 flex-1">
                    <Icon className="h-5 w-5 text-slate-600 flex-shrink-0" />
                    <div>
                      <CardTitle className="text-lg">
                        {announcement.title}
                      </CardTitle>
                      <p className="text-sm text-slate-500 mt-1">
                        {dayjs(announcement.createdAt).format(
                          "DD MMMM YYYY, HH:mm",
                        )}{" "}
                        WIB
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={priority.color}>{priority.label}</Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-slate-700 whitespace-pre-line mb-4">
                  {announcement.content}
                </p>

                <div className="flex justify-between items-center pt-4 border-t">
                  <p className="text-xs text-slate-500">
                    Diumumkan oleh {announcement.user.name}
                  </p>

                  {canManage && (
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          router.push(
                            `/dashboard/announcements/${announcement.id}`,
                          )
                        }
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      {canDelete && (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() =>
                            setDeleteDialog({
                              open: true,
                              id: announcement.id,
                              title: announcement.title,
                            })
                          }
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {announcements.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <Bell className="h-12 w-12 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900 mb-2">
              Belum ada pengumuman
            </h3>
            <p className="text-slate-600 mb-6">
              {canManage
                ? "Buat pengumuman baru untuk memberitahu warga"
                : "Belum ada pengumuman yang aktif"}
            </p>
            {canManage && (
              <Button
                onClick={() => router.push("/dashboard/announcements/create")}
              >
                <Plus className="h-4 w-4 mr-2" />
                Buat Pengumuman Pertama
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      <AlertDialog
        open={deleteDialog.open}
        onOpenChange={(open) =>
          !open && setDeleteDialog({ open: false, id: "", title: "" })
        }
      >
        <AlertDialogContent>
          <AlertDialogTitle>Hapus Pengumuman?</AlertDialogTitle>
          <AlertDialogDescription>
            Apakah Anda yakin ingin menghapus pengumuman{" "}
            <strong>"{deleteDialog.title}"</strong>? Tindakan ini tidak dapat
            dibatalkan.
          </AlertDialogDescription>
          <div className="flex gap-3 justify-end">
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting === deleteDialog.id}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleting === deleteDialog.id ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : null}
              Hapus
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

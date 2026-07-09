"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Clock, MapPin, Plus, Edit2, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import dayjs from "dayjs";
import "dayjs/locale/id";

dayjs.locale("id");

export default function ActivitiesPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const { toast } = useToast();
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    fetchActivities();
  }, []);

  const fetchActivities = async () => {
    try {
      const response = await fetch("/api/activities");
      const data = await response.json();
      setActivities(data.activities || []);
    } catch (error) {
      console.error("Failed to fetch activities:", error);
    } finally {
      setLoading(false);
    }
  };

  const canManage = ["SUPER_ADMIN", "KETUA_RT"].includes(
    session?.user?.role || "",
  );
  const canDelete = session?.user?.role === "SUPER_ADMIN";

  const handleDelete = async (id: string) => {
    try {
      setDeleting(id);
      const response = await fetch(`/api/activities/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete activity");

      toast({ title: "Sukses", description: "Kegiatan berhasil dihapus" });
      fetchActivities();
    } catch (error) {
      console.error("Delete activity error:", error);
      toast({
        title: "Error",
        description: "Gagal menghapus kegiatan",
        variant: "destructive",
      });
    } finally {
      setDeleting(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">
            Kalender Kegiatan
          </h1>
          <p className="text-slate-600 mt-1">Jadwal kegiatan dan acara RT</p>
        </div>
        {canManage && (
          <Button onClick={() => router.push("/dashboard/activities/create")}>
            <Plus className="h-4 w-4 mr-2" />
            Tambah Kegiatan
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {activities.map((activity) => (
          <Card key={activity.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex justify-between items-start">
                <CardTitle className="text-lg">{activity.title}</CardTitle>
                <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full font-medium">
                  {activity.type}
                </span>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {activity.description && (
                <p className="text-slate-600 text-sm">{activity.description}</p>
              )}

              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-slate-600">
                  <Calendar className="h-4 w-4 flex-shrink-0" />
                  <span>
                    {dayjs(activity.startDate).format("dddd, DD MMMM YYYY")}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-slate-600">
                  <Clock className="h-4 w-4 flex-shrink-0" />
                  <span>{dayjs(activity.startDate).format("HH:mm")} WIB</span>
                </div>

                {activity.location && (
                  <div className="flex items-center gap-2 text-slate-600">
                    <MapPin className="h-4 w-4 flex-shrink-0" />
                    <span>{activity.location}</span>
                  </div>
                )}
              </div>

              {canManage && (
                <div className="pt-4 flex gap-2 border-t">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      router.push(`/dashboard/activities/${activity.id}`)
                    }
                    className="flex-1"
                  >
                    <Edit2 className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                  {canDelete && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          size="sm"
                          variant="destructive"
                          className="flex-1"
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Hapus
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Hapus Kegiatan?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Apakah Anda yakin ingin menghapus kegiatan "
                            {activity.title}"? Tindakan ini tidak dapat
                            dibatalkan.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <div className="flex gap-3 justify-end">
                          <AlertDialogCancel>Batal</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(activity.id)}
                            disabled={deleting === activity.id}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            {deleting === activity.id ? "..." : "Hapus"}
                          </AlertDialogAction>
                        </div>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {activities.length === 0 && (
        <Card className="text-center py-12">
          <p className="text-slate-500 mb-4">Tidak ada kegiatan saat ini</p>
          {canManage && (
            <Button onClick={() => router.push("/dashboard/activities/create")}>
              Buat Kegiatan Pertama
            </Button>
          )}
        </Card>
      )}
    </div>
  );
}

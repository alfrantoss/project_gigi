"use client";

import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Loader2 } from "lucide-react";

interface Announcement {
  id: string;
  title: string;
  content: string;
  priority: string;
  isActive: boolean;
  createdAt: string;
  userId: string;
}

export default function EditAnnouncementPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [announcement, setAnnouncement] = useState<Announcement | null>(null);

  const [formData, setFormData] = useState({
    title: "",
    content: "",
    priority: "normal",
    isActive: true,
  });

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/login");
    }
  }, [status, router]);

  useEffect(() => {
    const fetchAnnouncement = async () => {
      try {
        const response = await fetch(`/api/announcements/${params.id}`);
        if (!response.ok) {
          throw new Error("Failed to fetch announcement");
        }
        const data = await response.json();
        setAnnouncement(data);
        setFormData({
          title: data.title,
          content: data.content,
          priority: data.priority || "normal",
          isActive: data.isActive,
        });
      } catch (error) {
        console.error("Fetch announcement error:", error);
        toast({
          title: "Error",
          description: "Gagal memuat pengumuman",
          variant: "destructive",
        });
        router.push("/dashboard/announcements");
      } finally {
        setLoading(false);
      }
    };

    if (status === "authenticated" && params.id) {
      fetchAnnouncement();
    }
  }, [status, params.id, router, toast]);

  if (status === "loading" || loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (status === "unauthenticated") {
    return null;
  }

  if (!announcement) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-600">Pengumuman tidak ditemukan</p>
        <Button
          onClick={() => router.push("/dashboard/announcements")}
          className="mt-4"
        >
          Kembali ke Daftar Pengumuman
        </Button>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title || !formData.content) {
      toast({
        title: "Error",
        description: "Judul dan isi pengumuman harus diisi",
        variant: "destructive",
      });
      return;
    }

    try {
      setSaving(true);

      const response = await fetch(`/api/announcements/${params.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formData.title,
          content: formData.content,
          priority: formData.priority,
          isActive: formData.isActive,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update announcement");
      }

      toast({
        title: "Success",
        description: "Pengumuman berhasil diperbarui",
      });
      router.push("/dashboard/announcements");
    } catch (error) {
      console.error("Update announcement error:", error);
      toast({
        title: "Error",
        description: "Gagal memperbarui pengumuman",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Edit Pengumuman</h1>
          <p className="text-slate-600 mt-1">Ubah detail pengumuman</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informasi Pengumuman</CardTitle>
          <CardDescription>
            Perbarui detail pengumuman sesuai kebutuhan
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Title */}
            <div>
              <Label htmlFor="title">Judul Pengumuman *</Label>
              <Input
                id="title"
                placeholder="Judul pengumuman"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                required
              />
            </div>

            {/* Content */}
            <div>
              <Label htmlFor="content">Isi Pengumuman *</Label>
              <Textarea
                id="content"
                placeholder="Isi pengumuman"
                value={formData.content}
                onChange={(e) =>
                  setFormData({ ...formData, content: e.target.value })
                }
                rows={6}
                required
              />
            </div>

            {/* Priority */}
            <div>
              <Label htmlFor="priority">Tingkat Prioritas</Label>
              <Select
                value={formData.priority}
                onValueChange={(value) =>
                  setFormData({ ...formData, priority: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Rendah</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="high">Tinggi</SelectItem>
                  <SelectItem value="urgent">Urgen</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Active Status */}
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) =>
                  setFormData({ ...formData, isActive: e.target.checked })
                }
                className="w-4 h-4"
              />
              <Label htmlFor="isActive">Pengumuman Aktif</Label>
            </div>

            {/* Buttons */}
            <div className="flex gap-3 pt-6">
              <Button type="submit" disabled={saving}>
                {saving ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : null}
                Simpan Perubahan
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
              >
                Batal
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

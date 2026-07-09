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
import {
  handleTextValidation,
  handleTextareaValidation,
  handleDateValidation,
  resetValidation,
} from '@/lib/form-validation';

export default function EditActivityPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    type: "Rapat",
    location: "",
    startDate: "",
    startTime: "09:00",
    endDate: "",
    endTime: "11:00",
  });

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/login");
    } else if (status === "authenticated") {
      fetchActivity();
    }
  }, [status, router]);

  const fetchActivity = async () => {
    try {
      const response = await fetch(`/api/activities/${params.id}`);
      if (!response.ok) throw new Error("Failed to fetch activity");

      const activity = await response.json();

      const startDate = new Date(activity.startDate);
      const startTime = startDate.toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      });

      setFormData({
        title: activity.title,
        description: activity.description,
        type: activity.type,
        location: activity.location || "",
        startDate: activity.startDate.split("T")[0],
        startTime,
        endDate: activity.endDate ? activity.endDate.split("T")[0] : "",
        endTime: activity.endDate
          ? new Date(activity.endDate).toLocaleTimeString("id-ID", {
              hour: "2-digit",
              minute: "2-digit",
              hour12: false,
            })
          : "11:00",
      });
    } catch (error) {
      console.error("Fetch activity error:", error);
      toast({
        title: "Error",
        description: "Gagal memuat kegiatan",
        variant: "destructive",
      });
      router.push("/dashboard/activities");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title || !formData.startDate) {
      toast({
        title: "Error",
        description: "Judul dan tanggal mulai harus diisi",
        variant: "destructive",
      });
      return;
    }

    try {
      setSaving(true);

      const startDateTime = `${formData.startDate}T${formData.startTime}`;
      const endDateTime = formData.endDate
        ? `${formData.endDate}T${formData.endTime}`
        : null;

      const response = await fetch(`/api/activities/${params.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          type: formData.type,
          location: formData.location,
          startDate: new Date(startDateTime).toISOString(),
          endDate: endDateTime ? new Date(endDateTime).toISOString() : null,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update activity");
      }

      toast({ title: "Sukses", description: "Kegiatan berhasil diperbarui" });
      router.push("/dashboard/activities");
    } catch (error) {
      console.error("Update activity error:", error);
      toast({
        title: "Error",
        description: "Gagal memperbarui kegiatan",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-8">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Edit Kegiatan</h1>
          <p className="text-slate-600 mt-1">Ubah detail kegiatan RT</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informasi Kegiatan</CardTitle>
          <CardDescription>Update detail kegiatan</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Title */}
            <div>
              <Label htmlFor="title">Judul Kegiatan *</Label>
              <Input
                id="title"
                placeholder="contoh: Rapat RT Bulanan"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                required
                onInvalid={handleTextValidation('Judul')}
                onInput={resetValidation}
              />
            </div>

            {/* Description */}
            <div>
              <Label htmlFor="description">Deskripsi</Label>
              <Textarea
                id="description"
                placeholder="Jelaskan detail kegiatan..."
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                rows={4}
                onInput={resetValidation}
              />
            </div>

            {/* Type and Location */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="type">Jenis Kegiatan *</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) =>
                    setFormData({ ...formData, type: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Rapat">Rapat</SelectItem>
                    <SelectItem value="Kerja Bakti">Kerja Bakti</SelectItem>
                    <SelectItem value="Pertemuan">Pertemuan</SelectItem>
                    <SelectItem value="Olahraga">Olahraga</SelectItem>
                    <SelectItem value="Sosial">Sosial</SelectItem>
                    <SelectItem value="Pelatihan">Pelatihan</SelectItem>
                    <SelectItem value="Lainnya">Lainnya</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="location">Lokasi</Label>
                <Input
                  id="location"
                  placeholder="contoh: Balai RT, Rumah Ketua RT"
                  value={formData.location}
                  onChange={(e) =>
                    setFormData({ ...formData, location: e.target.value })
                  }
                  onInput={resetValidation}
                />
              </div>
            </div>

            {/* Date and Time */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="startDate">Tanggal Mulai *</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) =>
                    setFormData({ ...formData, startDate: e.target.value })
                  }
                  required
                  onInvalid={handleDateValidation}
                  onInput={resetValidation}
                />
              </div>

              <div>
                <Label htmlFor="startTime">Jam Mulai</Label>
                <Input
                  id="startTime"
                  type="time"
                  value={formData.startTime}
                  onChange={(e) =>
                    setFormData({ ...formData, startTime: e.target.value })
                  }
                  onInput={resetValidation}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="endDate">Tanggal Selesai (Opsional)</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) =>
                    setFormData({ ...formData, endDate: e.target.value })
                  }
                  onInput={resetValidation}
                />
              </div>

              <div>
                <Label htmlFor="endTime">Jam Selesai</Label>
                <Input
                  id="endTime"
                  type="time"
                  value={formData.endTime}
                  onChange={(e) =>
                    setFormData({ ...formData, endTime: e.target.value })
                  }
                  onInput={resetValidation}
                />
              </div>
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

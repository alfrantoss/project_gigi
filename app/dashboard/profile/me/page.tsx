"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
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
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Loader2, User, Mail, Phone, Home, FileText } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import "dayjs/locale/id";

dayjs.extend(relativeTime);
dayjs.locale("id");

interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
  createdAt: string;
  updatedAt: string;
  warga?: {
    id: string;
    nomorRumah: string;
    alamat: string;
    nik: string;
    status: string;
    monthlyFee: number;
    totalPaid: number;
    totalDebt: number;
    ektp?: string;
    kartuKeluarga?: string;
  };
}

const roleLabels: { [key: string]: string } = {
  SUPER_ADMIN: "Super Admin",
  KETUA_RT: "Ketua RT",
  BENDAHARA: "Bendahara",
  WARGA: "Warga",
};

const statusColors: { [key: string]: string } = {
  AKTIF: "bg-green-100 text-green-800",
  PINDAH: "bg-yellow-100 text-yellow-800",
  MENINGGAL: "bg-gray-100 text-gray-800",
  NONAKTIF: "bg-red-100 text-red-800",
};

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { toast } = useToast();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
  });

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/login");
      return;
    }

    if (status === "authenticated") {
      fetchProfile();
    }
  }, [status, router]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/profile/me");
      if (!response.ok) {
        const errorData = await response.json();
        console.error("API Error:", errorData);
        
        // Jika session invalid, redirect ke logout
        if (errorData.code === "INVALID_SESSION" || response.status === 401) {
          toast({
            title: "Sesi Berakhir",
            description: "Silakan login kembali",
            variant: "destructive",
          });
          // Redirect ke logout setelah 2 detik
          setTimeout(() => {
            window.location.href = "/api/auth/signout";
          }, 2000);
          return;
        }
        
        throw new Error(errorData.error || "Failed to fetch profile");
      }
      const data = await response.json();
      console.log("Profile data received:", data);
      setProfile(data);
      setFormData({
        name: data.name || "",
        phone: data.phone || "",
      });
    } catch (error: any) {
      console.error("Fetch profile error:", error);
      toast({
        title: "Error",
        description: error.message || "Gagal memuat profil",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    try {
      setSaving(true);
      const response = await fetch("/api/profile/me", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error("Failed to update profile");

      toast({ title: "Sukses", description: "Profil berhasil diperbarui" });
      setIsEditing(false);
      fetchProfile();
    } catch (error) {
      console.error("Save profile error:", error);
      toast({
        title: "Error",
        description: "Gagal menyimpan profil",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading || !profile) {
    return <div className="p-8">Loading...</div>;
  }

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Profil Saya</h1>
        <p className="text-slate-600">
          Kelola informasi profil dan data pribadi Anda
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Profile Card */}
        <div className="lg:col-span-2 space-y-6">
          {/* Account Information */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Informasi Akun</CardTitle>
                <CardDescription>Data akun sistem Anda</CardDescription>
              </div>
              {!isEditing && (
                <Button
                  onClick={() => setIsEditing(true)}
                  variant="outline"
                  size="sm"
                >
                  Edit
                </Button>
              )}
            </CardHeader>
            <CardContent className="space-y-6">
              {isEditing ? (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="name">Nama Lengkap</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      placeholder="Masukkan nama lengkap"
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Nomor Telepon</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) =>
                        setFormData({ ...formData, phone: e.target.value })
                      }
                      placeholder="Masukkan nomor telepon"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleSaveProfile} disabled={saving}>
                      {saving ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : null}
                      Simpan
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setIsEditing(false);
                        setFormData({
                          name: profile.name,
                          phone: profile.phone || "",
                        });
                      }}
                    >
                      Batal
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <User className="w-5 h-5 text-slate-400" />
                    <div>
                      <p className="text-sm text-slate-600">Nama Lengkap</p>
                      <p className="font-medium">{profile.name}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Mail className="w-5 h-5 text-slate-400" />
                    <div>
                      <p className="text-sm text-slate-600">Email</p>
                      <p className="font-medium">{profile.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Phone className="w-5 h-5 text-slate-400" />
                    <div>
                      <p className="text-sm text-slate-600">Nomor Telepon</p>
                      <p className="font-medium">{profile.phone || "-"}</p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Role and Status */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Status Sistem</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <span className="text-sm text-slate-600">Role Pengguna</span>
                <Badge variant="outline">{roleLabels[profile.role]}</Badge>
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <span className="text-sm text-slate-600">Terdaftar Sejak</span>
                <span className="text-sm font-medium">
                  {dayjs(profile.createdAt).format("DD MMM YYYY")}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <span className="text-sm text-slate-600">
                  Terakhir Diperbarui
                </span>
                <span className="text-sm font-medium">
                  {dayjs(profile.updatedAt).fromNow()}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Warga Information (if resident) */}
          {profile.warga && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Informasi Warga</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                    <Home className="w-5 h-5 text-slate-400" />
                    <div>
                      <p className="text-xs text-slate-600">Nomor Rumah</p>
                      <p className="font-medium">{profile.warga?.nomorRumah || "-"}</p>
                    </div>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg">
                    <p className="text-xs text-slate-600">Status Warga</p>
                    <Badge
                      className={
                        statusColors[profile.warga?.status || "AKTIF"] || "bg-gray-100"
                      }
                    >
                      {profile.warga?.status || "AKTIF"}
                    </Badge>
                  </div>
                  <div className="md:col-span-2 p-3 bg-slate-50 rounded-lg">
                    <p className="text-xs text-slate-600">Alamat</p>
                    <p className="font-medium text-sm">
                      {profile.warga?.alamat || "-"}
                    </p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg">
                    <p className="text-xs text-slate-600">NIK</p>
                    <p className="font-mono text-sm">{profile.warga?.nik || "-"}</p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg">
                    <p className="text-xs text-slate-600">Iuran Bulanan</p>
                    <p className="font-medium">
                      {formatCurrency(profile.warga?.monthlyFee || 0)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Dokumen (if resident) */}
          {profile.warga && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Dokumen</CardTitle>
                <CardDescription>
                  Dokumen identitas yang telah diunggah
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <FileText className="w-5 h-5 text-slate-600" />
                      <p className="font-medium text-sm">E-KTP</p>
                    </div>
                    {profile.warga?.ektp ? (
                      <a
                        href={profile.warga?.ektp || "#"}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:underline"
                      >
                        Lihat Dokumen
                      </a>
                    ) : (
                      <p className="text-sm text-slate-500">
                        Belum diunggah
                      </p>
                    )}
                  </div>
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <FileText className="w-5 h-5 text-slate-600" />
                      <p className="font-medium text-sm">Kartu Keluarga</p>
                    </div>
                    {profile.warga?.kartuKeluarga ? (
                      <a
                        href={profile.warga?.kartuKeluarga || "#"}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:underline"
                      >
                        Lihat Dokumen
                      </a>
                    ) : (
                      <p className="text-sm text-slate-500">
                        Belum diunggah
                      </p>
                    )}
                  </div>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
                  <p className="font-medium mb-1">ℹ️ Informasi</p>
                  <p className="text-xs">
                    Untuk mengubah atau mengunggah dokumen, hubungi admin RT
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar - Quick Stats */}
        {profile.warga && (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Total Terbayar</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(profile.warga?.totalPaid || 0)}
                </p>
                <p className="text-xs text-slate-600 mt-1">
                  Iuran yang sudah dibayar
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Total Hutang</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-red-600">
                  {formatCurrency(profile.warga?.totalDebt || 0)}
                </p>
                <p className="text-xs text-slate-600 mt-1">
                  Sisa iuran yang belum dibayar
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Info Penting</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-xs text-slate-600">
                <p>✓ Profile dapat diedit kapan saja</p>
                <p>✓ Ubah password melalui menu akun</p>
                <p>✓ Role dikelola oleh admin sistem</p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}

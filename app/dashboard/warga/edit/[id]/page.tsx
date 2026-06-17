"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ArrowLeft, Eye, EyeOff, Upload, FileText, X } from "lucide-react";

export default function EditWargaPage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const wargaId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [uploadingEktp, setUploadingEktp] = useState(false);
  const [uploadingKK, setUploadingKK] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    nik: "",
    nomorRumah: "",
    alamat: "",
    rt: "001",
    rw: "016",
    kelurahan: "Bekasi Timur",
    kecamatan: "Bekasi Timur",
    statusPerkawinan: "",
    pekerjaan: "",
    monthlyFee: "",
    status: "AKTIF",
    password: "",
    ektp: "",
    kartuKeluarga: "",
  });

  useEffect(() => {
    fetchWarga();
  }, []);

  const fetchWarga = async () => {
    try {
      const response = await fetch(`/api/warga/${wargaId}`);
      if (!response.ok) throw new Error("Gagal mengambil data");

      const data = await response.json();
      setFormData({
        name: data.user.name,
        email: data.user.email,
        phone: data.user.phone || "",
        nik: data.nik,
        nomorRumah: data.nomorRumah,
        alamat: data.alamat,
        rt: data.rt,
        rw: data.rw,
        kelurahan: data.kelurahan,
        kecamatan: data.kecamatan,
        statusPerkawinan: data.statusPerkawinan || "",
        pekerjaan: data.pekerjaan || "",
        monthlyFee: data.monthlyFee.toString(),
        status: data.status,
        password: "",
        ektp: data.ektp || "",
        kartuKeluarga: data.kartuKeluarga || "",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Gagal mengambil data warga",
        variant: "destructive",
      });
      router.push("/dashboard/warga");
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    type: "ektp" | "kartuKeluarga"
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "application/pdf"];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Error",
        description: "Hanya file JPG, PNG, dan PDF yang diperbolehkan",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Error",
        description: "Ukuran file maksimal 5MB",
        variant: "destructive",
      });
      return;
    }

    const formDataUpload = new FormData();
    formDataUpload.append("file", file);
    formDataUpload.append("type", type);

    if (type === "ektp") {
      setUploadingEktp(true);
    } else {
      setUploadingKK(true);
    }

    try {
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formDataUpload,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Gagal mengupload file");
      }

      const data = await response.json();

      setFormData((prev) => ({
        ...prev,
        [type]: data.url,
      }));

      toast({
        title: "Sukses",
        description: "File berhasil diupload",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      if (type === "ektp") {
        setUploadingEktp(false);
      } else {
        setUploadingKK(false);
      }
    }
  };

  const handleRemoveFile = (type: "ektp" | "kartuKeluarga") => {
    setFormData((prev) => ({
      ...prev,
      [type]: "",
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const response = await fetch(`/api/warga/${wargaId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Gagal mengupdate warga");
      }

      toast({
        title: "Sukses",
        description: "Data warga berhasil diperbarui",
      });

      router.push("/dashboard/warga");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-slate-900" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Edit Data Warga</h1>
          <p className="text-slate-600 mt-1">Perbarui informasi warga</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Informasi Akun</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nama Lengkap *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Nomor Telepon</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password Baru (Opsional)</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  placeholder="Kosongkan jika tidak ingin mengubah"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Informasi Identitas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nik">NIK *</Label>
              <Input
                id="nik"
                value={formData.nik}
                onChange={(e) =>
                  setFormData({ ...formData, nik: e.target.value })
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="statusPerkawinan">Status Perkawinan</Label>
              <Select
                value={formData.statusPerkawinan}
                onValueChange={(value) =>
                  setFormData({ ...formData, statusPerkawinan: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih status perkawinan" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Belum Kawin">Belum Kawin</SelectItem>
                  <SelectItem value="Kawin">Kawin</SelectItem>
                  <SelectItem value="Cerai Hidup">Cerai Hidup</SelectItem>
                  <SelectItem value="Cerai Mati">Cerai Mati</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="pekerjaan">Pekerjaan</Label>
              <Input
                id="pekerjaan"
                value={formData.pekerjaan}
                onChange={(e) =>
                  setFormData({ ...formData, pekerjaan: e.target.value })
                }
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Informasi Alamat</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nomorRumah">No. Rumah *</Label>
              <Input
                id="nomorRumah"
                value={formData.nomorRumah}
                onChange={(e) =>
                  setFormData({ ...formData, nomorRumah: e.target.value })
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="alamat">Alamat *</Label>
              <Input
                id="alamat"
                value={formData.alamat}
                onChange={(e) =>
                  setFormData({ ...formData, alamat: e.target.value })
                }
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="rt">RT *</Label>
                <Input
                  id="rt"
                  value={formData.rt}
                  onChange={(e) =>
                    setFormData({ ...formData, rt: e.target.value })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="rw">RW *</Label>
                <Input
                  id="rw"
                  value={formData.rw}
                  onChange={(e) =>
                    setFormData({ ...formData, rw: e.target.value })
                  }
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="kelurahan">Kelurahan *</Label>
              <Input
                id="kelurahan"
                value={formData.kelurahan}
                onChange={(e) =>
                  setFormData({ ...formData, kelurahan: e.target.value })
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="kecamatan">Kecamatan *</Label>
              <Input
                id="kecamatan"
                value={formData.kecamatan}
                onChange={(e) =>
                  setFormData({ ...formData, kecamatan: e.target.value })
                }
                required
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Informasi Iuran & Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="monthlyFee">Iuran Bulanan (Rp) *</Label>
              <Input
                id="monthlyFee"
                type="number"
                value={formData.monthlyFee}
                onChange={(e) =>
                  setFormData({ ...formData, monthlyFee: e.target.value })
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status Warga *</Label>
              <Select
                value={formData.status}
                onValueChange={(value) =>
                  setFormData({ ...formData, status: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="AKTIF">Aktif</SelectItem>
                  <SelectItem value="PINDAH">Pindah</SelectItem>
                  <SelectItem value="MENINGGAL">Meninggal</SelectItem>
                  <SelectItem value="NONAKTIF">Nonaktif</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Dokumen</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="ektp">E-KTP</Label>
              {formData.ektp ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 p-3 border rounded-lg bg-slate-50">
                    <FileText className="h-5 w-5 text-slate-600" />
                    <a
                      href={formData.ektp}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:underline flex-1 truncate"
                    >
                      {formData.ektp.split("/").pop()}
                    </a>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveFile("ektp")}
                      className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Input
                    id="ektp"
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,application/pdf"
                    onChange={(e) => handleFileUpload(e, "ektp")}
                    disabled={uploadingEktp}
                    className="flex-1"
                  />
                  {uploadingEktp && (
                    <Loader2 className="h-4 w-4 animate-spin text-slate-600" />
                  )}
                </div>
              )}
              <p className="text-xs text-slate-500">
                Format: JPG, PNG, atau PDF. Maksimal 5MB
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="kartuKeluarga">Kartu Keluarga</Label>
              {formData.kartuKeluarga ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 p-3 border rounded-lg bg-slate-50">
                    <FileText className="h-5 w-5 text-slate-600" />
                    <a
                      href={formData.kartuKeluarga}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:underline flex-1 truncate"
                    >
                      {formData.kartuKeluarga.split("/").pop()}
                    </a>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveFile("kartuKeluarga")}
                      className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Input
                    id="kartuKeluarga"
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,application/pdf"
                    onChange={(e) => handleFileUpload(e, "kartuKeluarga")}
                    disabled={uploadingKK}
                    className="flex-1"
                  />
                  {uploadingKK && (
                    <Loader2 className="h-4 w-4 animate-spin text-slate-600" />
                  )}
                </div>
              )}
              <p className="text-xs text-slate-500">
                Format: JPG, PNG, atau PDF. Maksimal 5MB
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-3">
        <Button variant="outline" onClick={() => router.back()}>
          Batal
        </Button>
        <Button onClick={handleSubmit} disabled={submitting}>
          {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {submitting ? "Menyimpan..." : "Simpan Perubahan"}
        </Button>
      </div>
    </div>
  );
}

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
import {
  handleTextValidation,
  handleEmailValidation,
  handlePasswordValidation,
  handleNumberValidation,
  resetValidation,
} from "@/lib/form-validation";

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
        title: "Gagal",
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
        title: "Gagal",
        description: "Hanya file JPG, PNG, dan PDF yang diperbolehkan",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Gagal",
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
        title: "Gagal",
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
        title: "Gagal",
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
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nama Lengkap *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                required
                onInvalid={handleTextValidation('Nama lengkap')}
                onInput={resetValidation}
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
                onInvalid={handleEmailValidation}
                onInput={resetValidation}
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
                onInput={resetValidation}
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
                  minLength={8}
                  onInvalid={handlePasswordValidation}
                  onInput={resetValidation}
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
          </form>
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
                minLength={16}
                maxLength={16}
                onInvalid={handleTextValidation('NIK')}
                onInput={resetValidation}
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
                onInvalid={handleTextValidation('Nomor rumah')}
                onInput={resetValidation}
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
                onInvalid={handleTextValidation('Alamat')}
                onInput={resetValidation}
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
                  onInvalid={handleTextValidation('RT')}
                  onInput={resetValidation}
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
                  onInvalid={handleTextValidation('RW')}
                  onInput={resetValidation}
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
                onInvalid={handleTextValidation('Kelurahan')}
                onInput={resetValidation}
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
                onInvalid={handleTextValidation('Kecamatan')}
                onInput={resetValidation}
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
                min={0}
                onInvalid={handleNumberValidation('Iuran bulanan')}
                onInput={resetValidation}
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
                <div className="space-y-3">
                  {/* Preview Thumbnail */}
                  <div className="relative aspect-video bg-slate-100 rounded-lg overflow-hidden group border">
                    {formData.ektp.toLowerCase().endsWith('.pdf') ? (
                      // PDF Thumbnail
                      <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-red-50 to-red-100">
                        <FileText className="w-16 h-16 text-red-600 mb-2" />
                        <p className="text-xs text-red-700 font-medium">PDF Document</p>
                      </div>
                    ) : (
                      // Image Thumbnail
                      <img
                        src={formData.ektp}
                        alt="E-KTP Preview"
                        className="w-full h-full object-contain bg-slate-50"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          if (e.currentTarget.parentElement) {
                            e.currentTarget.parentElement.innerHTML = `
                              <div class="absolute inset-0 flex flex-col items-center justify-center bg-slate-200">
                                <svg class="w-12 h-12 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                <p class="text-xs text-slate-500 mt-2">Preview not available</p>
                              </div>
                            `;
                          }
                        }}
                      />
                    )}
                    {/* Hover overlay dengan icon mata */}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <a
                        href={formData.ektp}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex flex-col items-center gap-2 text-white hover:scale-110 transition-transform"
                      >
                        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        <span className="text-sm font-medium">Lihat Dokumen</span>
                      </a>
                    </div>
                  </div>
                  <a
                    href={formData.ektp}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                  >
                    <span className="truncate">Buka di tab baru</span>
                    <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleRemoveFile("ektp")}
                    className="w-full text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Hapus Dokumen
                  </Button>
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
                <div className="space-y-3">
                  {/* Preview Thumbnail */}
                  <div className="relative aspect-video bg-slate-100 rounded-lg overflow-hidden group border">
                    {formData.kartuKeluarga.toLowerCase().endsWith('.pdf') ? (
                      // PDF Thumbnail
                      <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-red-50 to-red-100">
                        <FileText className="w-16 h-16 text-red-600 mb-2" />
                        <p className="text-xs text-red-700 font-medium">PDF Document</p>
                      </div>
                    ) : (
                      // Image Thumbnail
                      <img
                        src={formData.kartuKeluarga}
                        alt="Kartu Keluarga Preview"
                        className="w-full h-full object-contain bg-slate-50"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          if (e.currentTarget.parentElement) {
                            e.currentTarget.parentElement.innerHTML = `
                              <div class="absolute inset-0 flex flex-col items-center justify-center bg-slate-200">
                                <svg class="w-12 h-12 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                <p class="text-xs text-slate-500 mt-2">Preview not available</p>
                              </div>
                            `;
                          }
                        }}
                      />
                    )}
                    {/* Hover overlay dengan icon mata */}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <a
                        href={formData.kartuKeluarga}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex flex-col items-center gap-2 text-white hover:scale-110 transition-transform"
                      >
                        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        <span className="text-sm font-medium">Lihat Dokumen</span>
                      </a>
                    </div>
                  </div>
                  <a
                    href={formData.kartuKeluarga}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                  >
                    <span className="truncate">Buka di tab baru</span>
                    <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleRemoveFile("kartuKeluarga")}
                    className="w-full text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Hapus Dokumen
                  </Button>
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

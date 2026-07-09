"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Loader2, FileText, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  handleTextValidation,
  handleEmailValidation,
  handlePasswordValidation,
  handleNumberValidation,
  handleTextareaValidation,
  resetValidation,
} from "@/lib/form-validation";

export default function TambahWargaPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [uploadingEktp, setUploadingEktp] = useState(false);
  const [uploadingKK, setUploadingKK] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    nik: "",
    nomorRumah: "",
    alamat: "",
    rt: "001",
    rw: "016",
    kelurahan: "Bekasi Timur",
    kecamatan: "Bekasi Timur",
    statusPerkawinan: "",
    pekerjaan: "",
    monthlyFee: "50000",
    ektp: "",
    kartuKeluarga: "",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
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

    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "Error",
        description: "Password tidak sesuai",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/warga", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          password: formData.password,
          nik: formData.nik,
          nomorRumah: formData.nomorRumah,
          alamat: formData.alamat,
          rt: formData.rt,
          rw: formData.rw,
          kelurahan: formData.kelurahan,
          kecamatan: formData.kecamatan,
          statusPerkawinan: formData.statusPerkawinan,
          pekerjaan: formData.pekerjaan,
          monthlyFee: parseInt(formData.monthlyFee),
          ektp: formData.ektp || null,
          kartuKeluarga: formData.kartuKeluarga || null,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Gagal menambahkan warga");
      }

      toast({
        title: "Sukses",
        description: "Data warga berhasil ditambahkan",
      });

      router.push("/dashboard/warga");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Gagal menambahkan warga",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-slate-900">
            Tambah Data Warga
          </h1>
          <p className="text-slate-600 mt-1">
            Tambahkan warga baru ke dalam sistem
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Informasi Akun</CardTitle>
              <CardDescription>Data login untuk warga</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nama Lengkap *</Label>
                    <Input
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="Nama lengkap"
                      required
                      onInvalid={handleTextValidation('Nama lengkap')}
                      onInput={resetValidation}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="email@example.com"
                      required
                      onInvalid={handleEmailValidation}
                      onInput={resetValidation}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Nomor Telepon</Label>
                    <Input
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="08123456789"
                      onInput={resetValidation}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="nik">NIK *</Label>
                    <Input
                      id="nik"
                      name="nik"
                      value={formData.nik}
                      onChange={handleChange}
                      placeholder="3201012345670001"
                      required
                      minLength={16}
                      maxLength={16}
                      onInvalid={handleTextValidation('NIK')}
                      onInput={resetValidation}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="password">Password *</Label>
                    <Input
                      id="password"
                      name="password"
                      type="password"
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="Masukkan password"
                      required
                      minLength={8}
                      onInvalid={handlePasswordValidation}
                      onInput={resetValidation}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">
                      Konfirmasi Password *
                    </Label>
                    <Input
                      id="confirmPassword"
                      name="confirmPassword"
                      type="password"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      placeholder="Konfirmasi password"
                      required
                      minLength={8}
                      onInvalid={handlePasswordValidation}
                      onInput={resetValidation}
                    />
                  </div>
                </div>

                <div className="border-t pt-6 space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900 mb-4">
                      Informasi Alamat
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="nomorRumah">Nomor Rumah *</Label>
                      <Input
                        id="nomorRumah"
                        name="nomorRumah"
                        value={formData.nomorRumah}
                        onChange={handleChange}
                        placeholder="01"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="rt">RT</Label>
                      <Input
                        id="rt"
                        name="rt"
                        value={formData.rt}
                        onChange={handleChange}
                        placeholder="001"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="rw">RW</Label>
                      <Input
                        id="rw"
                        name="rw"
                        value={formData.rw}
                        onChange={handleChange}
                        placeholder="001"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="kelurahan">Kelurahan</Label>
                      <Input
                        id="kelurahan"
                        name="kelurahan"
                        value={formData.kelurahan}
                        onChange={handleChange}
                        placeholder="Nama kelurahan"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="alamat">Alamat Lengkap *</Label>
                    <Textarea
                      id="alamat"
                      name="alamat"
                      value={formData.alamat}
                      onChange={handleChange}
                      placeholder="Alamat lengkap"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="kecamatan">Kecamatan</Label>
                    <Input
                      id="kecamatan"
                      name="kecamatan"
                      value={formData.kecamatan}
                      onChange={handleChange}
                      placeholder="Nama kecamatan"
                    />
                  </div>
                </div>

                <div className="border-t pt-6 space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900 mb-4">
                      Informasi Tambahan
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="statusPerkawinan">
                        Status Perkawinan
                      </Label>
                      <Input
                        id="statusPerkawinan"
                        name="statusPerkawinan"
                        value={formData.statusPerkawinan}
                        onChange={handleChange}
                        placeholder="Belum Menikah / Menikah / dst"
                        onInput={resetValidation}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="pekerjaan">Pekerjaan</Label>
                      <Input
                        id="pekerjaan"
                        name="pekerjaan"
                        value={formData.pekerjaan}
                        onChange={handleChange}
                        placeholder="Nama pekerjaan"
                        onInput={resetValidation}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="monthlyFee">Iuran Bulanan (Rp)</Label>
                    <Input
                      id="monthlyFee"
                      name="monthlyFee"
                      type="number"
                      value={formData.monthlyFee}
                      onChange={handleChange}
                      placeholder="50000"
                      min={0}
                      onInvalid={handleNumberValidation('Iuran bulanan')}
                      onInput={resetValidation}
                    />
                  </div>
                </div>

                <div className="border-t pt-6 space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900 mb-4">
                      Dokumen
                    </h3>
                  </div>

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
                </div>

                <div className="flex gap-3 pt-6 border-t">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.back()}
                    disabled={loading}
                  >
                    Batal
                  </Button>
                  <Button type="submit" disabled={loading}>
                    {loading && (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    )}
                    {loading ? "Menyimpan..." : "Simpan"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-1">
          <Card className="sticky top-6">
            <CardHeader>
              <CardTitle>Panduan</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-slate-600">
              <div>
                <p className="font-semibold text-slate-900 mb-1">
                  Field yang Wajib Diisi (*)
                </p>
                <p>
                  Pastikan semua field yang ditandai bintang (*) sudah terisi
                  dengan benar.
                </p>
              </div>
              <div>
                <p className="font-semibold text-slate-900 mb-1">NIK</p>
                <p>
                  Nomor Induk Kependudukan harus unik dan sesuai dengan KTP.
                </p>
              </div>
              <div>
                <p className="font-semibold text-slate-900 mb-1">Email</p>
                <p>Email akan digunakan untuk login dan notifikasi sistem.</p>
              </div>
              <div>
                <p className="font-semibold text-slate-900 mb-1">Password</p>
                <p>Gunakan password yang kuat dan mudah diingat oleh warga.</p>
              </div>
              <div>
                <p className="font-semibold text-slate-900 mb-1">
                  Iuran Bulanan
                </p>
                <p>Masukkan nominal iuran bulanan dalam rupiah.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

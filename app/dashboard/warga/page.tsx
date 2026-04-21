"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Users, Search, Plus, Download, Edit2, Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";

export default function WargaPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const { toast } = useToast();
  const [warga, setWarga] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [searching, setSearching] = useState(false);
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedWargaId, setSelectedWargaId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    fetchWarga(debouncedSearch);
  }, [debouncedSearch]);

  const fetchWarga = async (searchQuery = "") => {
    setSearching(true);
    try {
      const url = searchQuery ? `/api/warga?search=${searchQuery}` : "/api/warga";
      const response = await fetch(url);
      const data = await response.json();
      
      if (!response.ok) throw new Error(data.error || "Gagal mengambil data");
      
      setWarga(data.warga || []);
      setStats(data.stats);
    } catch (error: any) {
      console.error("Failed to fetch warga:", error);
      toast({
        title: "Error",
        description: error.message || "Gagal mengambil data warga",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setSearching(false);
    }
  };

  const handleExport = async () => {
    try {
      const response = await fetch("/api/warga?export=true");
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `data_warga_${new Date().toISOString().split("T")[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Failed to export:", error);
      alert("Gagal mengexport data");
    }
  };

  const handleTambahWarga = () => {
    router.push("/dashboard/warga/tambah");
  };

  const handleEditWarga = (wargaId: string) => {
    router.push(`/dashboard/warga/edit/${wargaId}`);
  };

  const handleDeleteWarga = async () => {
    if (!selectedWargaId) return;

    setDeleting(true);
    try {
      const response = await fetch(`/api/warga/${selectedWargaId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Gagal menghapus warga");
      }

      toast({
        title: "Sukses",
        description: "Data warga berhasil dihapus",
      });

      setDeleteDialogOpen(false);
      setSelectedWargaId(null);
      fetchWarga();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Gagal menghapus warga",
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
    }
  };

  const canManage = ["SUPER_ADMIN", "KETUA_RT"].includes(
    session?.user.role || "",
  );
  const canDelete = session?.user.role === "SUPER_ADMIN";

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
          <h1 className="text-3xl font-bold text-slate-900">Data Warga</h1>
          <p className="text-slate-600 mt-1">Kelola data warga RT</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          {canManage && (
            <Button onClick={handleTambahWarga}>
              <Plus className="h-4 w-4 mr-2" />
              Tambah Warga
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">
              Total Warga
            </CardTitle>
            <Users className="h-5 w-5 text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">
              {stats?.totalWarga || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">
              Warga Aktif
            </CardTitle>
            <Users className="h-5 w-5 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {stats?.totalActive || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">
              Total Terbayar
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">
              Rp {stats?.totalPaid?.toLocaleString("id-ID") || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">
              Total Hutang
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              Rp {stats?.totalDebt?.toLocaleString("id-ID") || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Daftar Warga</CardTitle>
              <div className="relative w-72">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Cari nama atau NIK..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
                {searching && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <div className="animate-spin h-4 w-4 border-2 border-slate-300 border-t-slate-600 rounded-full"></div>
                  </div>
                )}
              </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>No. Rumah</TableHead>
                <TableHead>Nama</TableHead>
                <TableHead>NIK</TableHead>
                <TableHead>Alamat</TableHead>
                <TableHead>Telepon</TableHead>
                <TableHead className="text-right">Iuran Bulanan</TableHead>
                <TableHead className="text-right">Hutang</TableHead>
                <TableHead className="text-center">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {searching && warga.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-24 text-center">
                    Mencari warga...
                  </TableCell>
                </TableRow>
              ) : warga.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-24 text-center text-slate-500">
                    {search ? "Warga tidak ditemukan" : "Tidak ada data warga"}
                  </TableCell>
                </TableRow>
              ) : (
                warga.map((w) => (
                  <TableRow key={w.id} className={searching ? "opacity-50" : ""}>
                    <TableCell className="font-medium">{w.nomorRumah}</TableCell>
                    <TableCell>{w.user.name}</TableCell>
                    <TableCell>{w.nik}</TableCell>
                    <TableCell>{w.alamat}</TableCell>
                    <TableCell>{w.user.phone || "-"}</TableCell>
                    <TableCell className="text-right">
                      Rp {w.monthlyFee.toLocaleString("id-ID")}
                    </TableCell>
                    <TableCell className="text-right">
                      <span
                        className={
                          w.totalDebt > 0 ? "text-red-600 font-medium" : ""
                        }
                      >
                        Rp {w.totalDebt.toLocaleString("id-ID")}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      {canManage ? (
                        <div className="flex gap-2 justify-center">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditWarga(w.id)}
                            className="h-8 w-8 p-0"
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          {canDelete && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                              onClick={() => {
                                setSelectedWargaId(w.id);
                                setDeleteDialogOpen(true);
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      ) : (
                        <span className="text-sm text-slate-500">-</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {/* Delete Confirmation Dialog */}
          <AlertDialog
            open={deleteDialogOpen}
            onOpenChange={setDeleteDialogOpen}
          >
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Hapus Warga?</AlertDialogTitle>
                <AlertDialogDescription>
                  Apakah Anda yakin ingin menghapus data warga ini? Tindakan ini
                  tidak dapat dibatalkan.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 text-sm text-yellow-800">
                ⚠️ Semua data terkait (tagihan, pembayaran, dll) akan ikut
                terhapus.
              </div>
              <AlertDialogCancel>Batal</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteWarga}
                disabled={deleting}
                className="bg-red-600 hover:bg-red-700"
              >
                {deleting ? "Menghapus..." : "Hapus"}
              </AlertDialogAction>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>
    </div>
  );
}

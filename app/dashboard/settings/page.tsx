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
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle, AlertCircle, Loader2 } from "lucide-react";

interface Setting {
  id: string;
  key: string;
  value: string;
  description?: string;
  updatedAt: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: string;
}

export default function SettingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { toast } = useToast();

  const [settings, setSettings] = useState<Setting[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [editDescription, setEditDescription] = useState("");

  const [newSetting, setNewSetting] = useState({
    key: "",
    value: "",
    description: "",
  });
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/login");
      return;
    }

    if (status === "authenticated") {
      if (session?.user?.role !== "SUPER_ADMIN") {
        router.push("/dashboard");
        return;
      }
      fetchSettings();
    }
  }, [status, session, router]);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/settings");
      if (!response.ok) throw new Error("Failed to fetch settings");
      const data = await response.json();
      setSettings(data.settings);
      setUsers(data.users);
    } catch (error) {
      console.error("Fetch settings error:", error);
      toast({
        title: "Error",
        description: "Gagal memuat pengaturan",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSetting = async () => {
    if (!editingKey || !editValue) {
      toast({
        title: "Error",
        description: "Key dan value tidak boleh kosong",
        variant: "destructive",
      });
      return;
    }

    try {
      setSaving(true);
      const response = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key: editingKey,
          value: editValue,
          description: editDescription,
        }),
      });

      if (!response.ok) throw new Error("Failed to save setting");

      toast({ title: "Success", description: "Pengaturan berhasil disimpan" });
      setEditingKey(null);
      fetchSettings();
    } catch (error) {
      console.error("Save setting error:", error);
      toast({
        title: "Error",
        description: "Gagal menyimpan pengaturan",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleAddNewSetting = async () => {
    if (!newSetting.key || !newSetting.value) {
      toast({
        title: "Error",
        description: "Key dan value tidak boleh kosong",
        variant: "destructive",
      });
      return;
    }

    try {
      setSaving(true);
      const response = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newSetting),
      });

      if (!response.ok) throw new Error("Failed to add setting");

      toast({
        title: "Success",
        description: "Pengaturan baru berhasil ditambahkan",
      });
      setNewSetting({ key: "", value: "", description: "" });
      fetchSettings();
    } catch (error) {
      console.error("Add setting error:", error);
      toast({
        title: "Error",
        description: "Gagal menambahkan pengaturan",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateUserRole = async (
    userId: string,
    role: string,
    isActive: boolean,
  ) => {
    try {
      setUpdatingUserId(userId);
      const response = await fetch(`/api/settings/users/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role, isActive }),
      });

      if (!response.ok) throw new Error("Failed to update user");

      toast({ title: "Success", description: "User role berhasil diperbarui" });
      fetchSettings();
    } catch (error) {
      console.error("Update user role error:", error);
      toast({
        title: "Error",
        description: "Gagal memperbarui user role",
        variant: "destructive",
      });
    } finally {
      setUpdatingUserId(null);
    }
  };

  if (loading) {
    return <div className="p-8">Loading...</div>;
  }

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Pengaturan Sistem</h1>
        <p className="text-slate-600">
          Kelola konfigurasi aplikasi dan manajemen pengguna
        </p>
      </div>

      <Tabs defaultValue="settings" className="w-full">
        <TabsList>
          <TabsTrigger value="settings">Pengaturan Aplikasi</TabsTrigger>
          <TabsTrigger value="users">Manajemen Pengguna</TabsTrigger>
        </TabsList>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-6">
          {/* Add New Setting */}
          <Card>
            <CardHeader>
              <CardTitle>Tambah Pengaturan Baru</CardTitle>
              <CardDescription>
                Tambahkan konfigurasi sistem baru
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="new-key">Kunci Setting</Label>
                  <Input
                    id="new-key"
                    placeholder="contoh: IURAN_BULANAN"
                    value={newSetting.key}
                    onChange={(e) =>
                      setNewSetting({ ...newSetting, key: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="new-value">Nilai</Label>
                  <Input
                    id="new-value"
                    placeholder="contoh: 50000"
                    value={newSetting.value}
                    onChange={(e) =>
                      setNewSetting({ ...newSetting, value: e.target.value })
                    }
                  />
                </div>
                <div className="flex items-end">
                  <Button
                    onClick={handleAddNewSetting}
                    disabled={saving}
                    className="w-full"
                  >
                    {saving ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : null}
                    Tambah
                  </Button>
                </div>
              </div>
              <div>
                <Label htmlFor="new-desc">Deskripsi (Opsional)</Label>
                <Textarea
                  id="new-desc"
                  placeholder="Deskripsi setting..."
                  value={newSetting.description}
                  onChange={(e) =>
                    setNewSetting({
                      ...newSetting,
                      description: e.target.value,
                    })
                  }
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Settings List */}
          <Card>
            <CardHeader>
              <CardTitle>Daftar Pengaturan</CardTitle>
              <CardDescription>Pengaturan sistem yang tersedia</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {settings.map((setting) => (
                  <div
                    key={setting.id}
                    className="border rounded-lg p-4 space-y-3"
                  >
                    {editingKey === setting.key ? (
                      <>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label className="text-xs">Kunci</Label>
                            <Input
                              disabled
                              value={setting.key}
                              className="bg-slate-100"
                            />
                          </div>
                          <div>
                            <Label className="text-xs">Nilai</Label>
                            <Input
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                            />
                          </div>
                        </div>
                        <div>
                          <Label className="text-xs">Deskripsi</Label>
                          <Textarea
                            value={editDescription}
                            onChange={(e) => setEditDescription(e.target.value)}
                            rows={2}
                          />
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={handleSaveSetting}
                            disabled={saving}
                          >
                            {saving ? (
                              <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                            ) : null}
                            Simpan
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setEditingKey(null)}
                          >
                            Batal
                          </Button>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="font-mono font-medium text-sm">
                              {setting.key}
                            </p>
                            <p className="text-sm text-slate-600">
                              {setting.value}
                            </p>
                            {setting.description && (
                              <p className="text-xs text-slate-500 mt-1">
                                {setting.description}
                              </p>
                            )}
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setEditingKey(setting.key);
                              setEditValue(setting.value);
                              setEditDescription(setting.description || "");
                            }}
                          >
                            Edit
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
                {settings.length === 0 && (
                  <p className="text-center text-slate-500">
                    Belum ada pengaturan
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Users Tab */}
        <TabsContent value="users" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Manajemen Pengguna</CardTitle>
              <CardDescription>
                Kelola role dan status pengguna sistem
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nama</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">
                          {user.name}
                        </TableCell>
                        <TableCell className="text-sm">{user.email}</TableCell>
                        <TableCell>
                          <Select
                            defaultValue={user.role}
                            disabled={
                              user.email === session?.user?.email ||
                              updatingUserId === user.id
                            }
                            onValueChange={(role) =>
                              handleUpdateUserRole(user.id, role, user.isActive)
                            }
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="SUPER_ADMIN">
                                Super Admin
                              </SelectItem>
                              <SelectItem value="KETUA_RT">Ketua RT</SelectItem>
                              <SelectItem value="BENDAHARA">
                                Bendahara
                              </SelectItem>
                              <SelectItem value="WARGA">Warga</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {user.isActive ? (
                              <CheckCircle className="w-4 h-4 text-green-600" />
                            ) : (
                              <AlertCircle className="w-4 h-4 text-red-600" />
                            )}
                            <span className="text-sm">
                              {user.isActive ? "Aktif" : "Nonaktif"}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {user.email !== session?.user?.email && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                handleUpdateUserRole(
                                  user.id,
                                  user.role,
                                  !user.isActive,
                                )
                              }
                              disabled={updatingUserId === user.id}
                            >
                              {updatingUserId === user.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : user.isActive ? (
                                "Nonaktifkan"
                              ) : (
                                "Aktifkan"
                              )}
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

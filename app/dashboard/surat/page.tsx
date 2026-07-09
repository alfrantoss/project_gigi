'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { FileText, Plus, Download, Check, X } from 'lucide-react';
import dayjs from 'dayjs';
import 'dayjs/locale/id';
import {
  handleTextValidation,
  handleTextareaValidation,
  handleDateValidation,
  handleNumberValidation,
  resetValidation,
} from '@/lib/form-validation';

dayjs.locale('id');

const statusColors = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  APPROVED: 'bg-green-100 text-green-800',
  REJECTED: 'bg-red-100 text-red-800',
};

const statusLabels = {
  PENDING: 'Menunggu',
  APPROVED: 'Disetujui',
  REJECTED: 'Ditolak',
};

const suratTypes = {
  DOMISILI: 'Surat Keterangan Domisili',
  PENGANTAR: 'Surat Pengantar',
  IZIN_USAHA: 'Surat Izin Usaha',
  KETERANGAN_TIDAK_MAMPU: 'Surat Keterangan Tidak Mampu',
  LAINNYA: 'Lainnya',
};

export default function SuratPage() {
  const { data: session } = useSession();
  const [surats, setSurats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    type: 'DOMISILI',
    title: '',
    purpose: '',
    data: {
      tempatLahir: '',
      tanggalLahir: '',
      keperluan: '',
      jenisKelamin: 'Laki-laki',
      agama: 'Islam',
      noTelp: '',
      jenisUsaha: '',
      lokasiUsaha: '',
      statusHubungan: 'Kepala Keluarga',
      namaBapak: '',
      umurBapak: '',
      pekerjaanBapak: '',
      namaIbu: '',
      umurIbu: '',
      pekerjaanIbu: 'Ibu Rumah Tangga',
    },
  });
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [selectedSuratId, setSelectedSuratId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  useEffect(() => {
    fetchSurats();
  }, []);

  const fetchSurats = async () => {
    try {
      const response = await fetch('/api/surat');
      const data = await response.json();
      setSurats(data.surats);
    } catch (error) {
      console.error('Failed to fetch surats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await fetch('/api/surat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setDialogOpen(false);
        setFormData({
          type: 'DOMISILI',
          title: '',
          purpose: '',
          data: {
            tempatLahir: '',
            tanggalLahir: '',
            keperluan: '',
            jenisKelamin: 'Laki-laki',
            agama: 'Islam',
            noTelp: '',
            jenisUsaha: '',
            lokasiUsaha: '',
            statusHubungan: 'Kepala Keluarga',
            namaBapak: '',
            umurBapak: '',
            pekerjaanBapak: '',
            namaIbu: '',
            umurIbu: '',
            pekerjaanIbu: 'Ibu Rumah Tangga',
          },
        });
        fetchSurats();
      }
    } catch (error) {
      console.error('Failed to create surat:', error);
    }
  };

  const handleApprove = async (id: string) => {
    try {
      const response = await fetch(`/api/surat/${id}/approve`, {
        method: 'POST',
      });

      if (response.ok) {
        fetchSurats();
      }
    } catch (error) {
      console.error('Failed to approve surat:', error);
    }
  };

  const handleReject = async () => {
    if (!selectedSuratId || !rejectionReason) return;

    try {
      const response = await fetch(`/api/surat/${selectedSuratId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: rejectionReason }),
      });

      if (response.ok) {
        setRejectDialogOpen(false);
        setRejectionReason('');
        setSelectedSuratId(null);
        fetchSurats();
      }
    } catch (error) {
      console.error('Failed to reject surat:', error);
    }
  };

  const handleDownload = (id: string) => {
    window.location.href = `/api/surat/${id}/download`;
  };

  const canManage = ['SUPER_ADMIN', 'KETUA_RT'].includes(session?.user.role || '');
  const isWarga = session?.user.role === 'WARGA';

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
            {isWarga ? 'Pengajuan Surat' : 'Manajemen Surat'}
          </h1>
          <p className="text-slate-600 mt-1">
            {isWarga
              ? 'Ajukan permohonan surat keterangan'
              : 'Kelola pengajuan surat dari warga'}
          </p>
        </div>
        {isWarga && (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Ajukan Surat
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Ajukan Surat Baru</DialogTitle>
                <DialogDescription>
                  Isi form di bawah untuk mengajukan permohonan surat
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>Jenis Surat</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value) => setFormData({ ...formData, type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(suratTypes).map(([key, label]) => (
                        <SelectItem key={key} value={key}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="title">Judul Surat</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="contoh: Permohonan Surat Domisili"
                    required
                    onInvalid={handleTextValidation('Judul')}
                    onInput={resetValidation}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="purpose">Keperluan</Label>
                  <Textarea
                    id="purpose"
                    value={formData.purpose}
                    onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                    placeholder="Untuk keperluan apa surat ini dibutuhkan"
                    required
                    onInvalid={handleTextareaValidation('Keperluan')}
                    onInput={resetValidation}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tempatLahir">Tempat Lahir</Label>
                  <Input
                    id="tempatLahir"
                    value={formData.data.tempatLahir}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        data: { ...formData.data, tempatLahir: e.target.value },
                      })
                    }
                    onInput={resetValidation}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tanggalLahir">Tanggal Lahir</Label>
                  <Input
                    id="tanggalLahir"
                    type="date"
                    value={formData.data.tanggalLahir}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        data: { ...formData.data, tanggalLahir: e.target.value },
                      })
                    }
                    onInput={resetValidation}
                  />
                </div>

                {/* Field khusus untuk Surat Izin Usaha */}
                {formData.type === 'IZIN_USAHA' && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="jenisUsaha">Jenis Usaha</Label>
                      <Input
                        id="jenisUsaha"
                        value={formData.data.jenisUsaha}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            data: { ...formData.data, jenisUsaha: e.target.value },
                          })
                        }
                        placeholder="Contoh: Toko Kelontong"
                        onInput={resetValidation}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="noTelp">Nomor Telepon</Label>
                      <Input
                        id="noTelp"
                        value={formData.data.noTelp}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            data: { ...formData.data, noTelp: e.target.value },
                          })
                        }
                        placeholder="08xx"
                        onInput={resetValidation}
                      />
                    </div>
                  </>
                )}

                {/* Field khusus untuk SKTM */}
                {formData.type === 'KETERANGAN_TIDAK_MAMPU' && (
                  <>
                    <div className="pt-2 border-t">
                      <Label className="font-semibold">Data Orang Tua / Wali</Label>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="namaBapak">Nama Bapak</Label>
                      <Input
                        id="namaBapak"
                        value={formData.data.namaBapak}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            data: { ...formData.data, namaBapak: e.target.value },
                          })
                        }
                        onInput={resetValidation}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="umurBapak">Umur</Label>
                        <Input
                          id="umurBapak"
                          type="number"
                          value={formData.data.umurBapak}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              data: { ...formData.data, umurBapak: e.target.value },
                            })
                          }
                          onInput={resetValidation}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="pekerjaanBapak">Pekerjaan</Label>
                        <Input
                          id="pekerjaanBapak"
                          value={formData.data.pekerjaanBapak}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              data: { ...formData.data, pekerjaanBapak: e.target.value },
                            })
                          }
                          onInput={resetValidation}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="namaIbu">Nama Ibu</Label>
                      <Input
                        id="namaIbu"
                        value={formData.data.namaIbu}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            data: { ...formData.data, namaIbu: e.target.value },
                          })
                        }
                        onInput={resetValidation}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="umurIbu">Umur</Label>
                        <Input
                          id="umurIbu"
                          type="number"
                          value={formData.data.umurIbu}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              data: { ...formData.data, umurIbu: e.target.value },
                            })
                          }
                          onInput={resetValidation}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="pekerjaanIbu">Pekerjaan</Label>
                        <Input
                          id="pekerjaanIbu"
                          value={formData.data.pekerjaanIbu}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              data: { ...formData.data, pekerjaanIbu: e.target.value },
                            })
                          }
                          onInput={resetValidation}
                        />
                      </div>
                    </div>
                  </>
                )}

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                    Batal
                  </Button>
                  <Button type="submit">Ajukan</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Daftar Pengajuan Surat</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                {!isWarga && <TableHead>Nama Pemohon</TableHead>}
                <TableHead>Jenis Surat</TableHead>
                <TableHead>Judul</TableHead>
                <TableHead>Keperluan</TableHead>
                <TableHead>Tanggal Ajuan</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {surats.map((surat) => (
                <TableRow key={surat.id}>
                  {!isWarga && <TableCell>{surat.user.name}</TableCell>}
                  <TableCell>
                    {suratTypes[surat.type as keyof typeof suratTypes]}
                  </TableCell>
                  <TableCell className="font-medium">{surat.title}</TableCell>
                  <TableCell>{surat.purpose}</TableCell>
                  <TableCell>{dayjs(surat.createdAt).format('DD MMM YYYY')}</TableCell>
                  <TableCell>
                    <Badge className={statusColors[surat.status as keyof typeof statusColors]}>
                      {statusLabels[surat.status as keyof typeof statusLabels]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      {canManage && surat.status === 'PENDING' && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleApprove(surat.id)}
                          >
                            <Check className="h-4 w-4 mr-1" />
                            Setujui
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                            onClick={() => {
                              setSelectedSuratId(surat.id);
                              setRejectDialogOpen(true);
                            }}
                          >
                            <X className="h-4 w-4 mr-1" />
                            Tolak
                          </Button>
                        </>
                      )}
                      {surat.status === 'APPROVED' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDownload(surat.id)}
                        >
                          <Download className="h-4 w-4 mr-1" />
                          Unduh
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Tolak Pengajuan Surat</DialogTitle>
            <DialogDescription>
              Berikan alasan mengapa pengajuan surat ini ditolak.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="reason">Alasan Penolakan</Label>
              <Textarea
                id="reason"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Masukkan alasan penolakan..."
                className="min-h-[100px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setRejectDialogOpen(false);
                setRejectionReason('');
              }}
            >
              Batal
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={!rejectionReason.trim()}
            >
              Tolak Sekarang
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

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
import { Plus, Download, TrendingUp, TrendingDown, Wallet } from 'lucide-react';
import dayjs from 'dayjs';
import 'dayjs/locale/id';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  handleTextValidation,
  handleTextareaValidation,
  handleNumberValidation,
  handleDateValidation,
  resetValidation,
} from '@/lib/form-validation';

dayjs.locale('id');

export default function TransactionsPage() {
  const { data: session } = useSession();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [exportFilter, setExportFilter] = useState({
    startDate: dayjs().startOf('month').format('YYYY-MM-DD'),
    endDate: dayjs().endOf('month').format('YYYY-MM-DD'),
    type: 'ALL', // ALL, PEMASUKAN, PENGELUARAN
    category: 'ALL',
  });
  const [formData, setFormData] = useState({
    type: 'PEMASUKAN',
    category: '',
    description: '',
    amount: '',
    date: dayjs().format('YYYY-MM-DD'),
    notes: '',
  });

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      const response = await fetch('/api/transactions');
      const data = await response.json();
      setTransactions(data.transactions);
      setSummary(data.summary);
    } catch (error) {
      console.error('Failed to fetch transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExportPDF = () => {
    // Filter transaksi berdasarkan filter yang dipilih
    const filteredTransactions = transactions.filter((t) => {
      const transactionDate = dayjs(t.date);
      const startDate = dayjs(exportFilter.startDate);
      const endDate = dayjs(exportFilter.endDate);
      
      const isInDateRange = 
        (transactionDate.isAfter(startDate) || transactionDate.isSame(startDate, 'day')) &&
        (transactionDate.isBefore(endDate) || transactionDate.isSame(endDate, 'day'));
      
      const isTypeMatch = 
        exportFilter.type === 'ALL' || t.type === exportFilter.type;
      
      const isCategoryMatch = 
        exportFilter.category === 'ALL' || t.category === exportFilter.category;
      
      return isInDateRange && isTypeMatch && isCategoryMatch;
    });

    // Hitung summary untuk data yang difilter
    const totalPemasukan = filteredTransactions
      .filter((t) => t.type === 'PEMASUKAN')
      .reduce((sum, t) => sum + t.amount, 0);
    const totalPengeluaran = filteredTransactions
      .filter((t) => t.type === 'PENGELUARAN')
      .reduce((sum, t) => sum + t.amount, 0);
    const filteredSummary = {
      totalPemasukan,
      totalPengeluaran,
      saldo: totalPemasukan - totalPengeluaran,
    };

    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('LAPORAN KEUANGAN', 105, 20, { align: 'center' });
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text('RT 001 / RW 016 Pesona Gading Cibitung 1', 105, 28, { align: 'center' });
    
    doc.setFontSize(10);
    doc.text(
      `Periode: ${dayjs(exportFilter.startDate).format('DD MMM YYYY')} - ${dayjs(exportFilter.endDate).format('DD MMM YYYY')}`,
      105,
      35,
      { align: 'center' }
    );
    doc.text(`Dicetak: ${dayjs().format('DD MMMM YYYY HH:mm')}`, 105, 41, { align: 'center' });
    
    // Filter info
    let filterInfo = [];
    if (exportFilter.type !== 'ALL') {
      filterInfo.push(`Jenis: ${exportFilter.type}`);
    }
    if (exportFilter.category !== 'ALL') {
      filterInfo.push(`Kategori: ${exportFilter.category}`);
    }
    if (filterInfo.length > 0) {
      doc.setFontSize(9);
      doc.setTextColor(100);
      doc.text(`Filter: ${filterInfo.join(' | ')}`, 105, 46, { align: 'center' });
    }
    
    // Summary Box
    doc.setTextColor(0, 0, 0);
    doc.setDrawColor(200, 200, 200);
    doc.setFillColor(245, 245, 245);
    doc.roundedRect(15, 52, 180, 30, 3, 3, 'FD');
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('RINGKASAN', 20, 59);
    
    doc.setFont('helvetica', 'normal');
    doc.text('Total Pemasukan:', 20, 66);
    doc.setTextColor(22, 163, 74); // green
    doc.text(`Rp ${filteredSummary.totalPemasukan.toLocaleString('id-ID')}`, 65, 66);
    
    doc.setTextColor(0, 0, 0);
    doc.text('Total Pengeluaran:', 20, 73);
    doc.setTextColor(220, 38, 38); // red
    doc.text(`Rp ${filteredSummary.totalPengeluaran.toLocaleString('id-ID')}`, 65, 73);
    
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'bold');
    doc.text('Saldo:', 120, 66);
    doc.setTextColor(28, 47, 87); // blue
    doc.text(`Rp ${filteredSummary.saldo.toLocaleString('id-ID')}`, 145, 66);
    
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'normal');
    doc.text(`Total Transaksi: ${filteredTransactions.length}`, 120, 73);
    
    // Table
    doc.setTextColor(0, 0, 0);
    const tableData = filteredTransactions.map((t) => [
      dayjs(t.date).format('DD/MM/YYYY'),
      t.type === 'PEMASUKAN' ? 'Pemasukan' : 'Pengeluaran',
      t.category,
      t.description,
      `${t.type === 'PEMASUKAN' ? '+' : '-'} Rp ${t.amount.toLocaleString('id-ID')}`,
    ]);
    
    autoTable(doc, {
      startY: 89,
      head: [['Tanggal', 'Jenis', 'Kategori', 'Keterangan', 'Jumlah']],
      body: tableData,
      theme: 'grid',
      headStyles: {
        fillColor: [28, 47, 87],
        textColor: 255,
        fontSize: 9,
        fontStyle: 'bold',
        halign: 'center',
      },
      bodyStyles: {
        fontSize: 8,
      },
      columnStyles: {
        0: { halign: 'center', cellWidth: 25 },
        1: { halign: 'center', cellWidth: 28 },
        2: { cellWidth: 35 },
        3: { cellWidth: 60 },
        4: { halign: 'right', cellWidth: 42 },
      },
      didParseCell: (data) => {
        if (data.section === 'body' && data.column.index === 4) {
          const text = data.cell.text[0];
          if (text.startsWith('+')) {
            data.cell.styles.textColor = [22, 163, 74]; // green
            data.cell.styles.fontStyle = 'bold';
          } else if (text.startsWith('-')) {
            data.cell.styles.textColor = [220, 38, 38]; // red
            data.cell.styles.fontStyle = 'bold';
          }
        }
      },
    });
    
    // Footer
    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text(
        `Halaman ${i} dari ${pageCount}`,
        105,
        doc.internal.pageSize.height - 10,
        { align: 'center' }
      );
      doc.text(
        'Sistem Manajemen Warga RT 001',
        105,
        doc.internal.pageSize.height - 6,
        { align: 'center' }
      );
    }
    
    // Save dengan nama file yang mencerminkan filter
    let filename = `Laporan-Keuangan-${dayjs(exportFilter.startDate).format('YYYY-MM-DD')}_${dayjs(exportFilter.endDate).format('YYYY-MM-DD')}`;
    if (exportFilter.type !== 'ALL') {
      filename += `-${exportFilter.type}`;
    }
    doc.save(`${filename}.pdf`);
    
    // Close dialog
    setExportDialogOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setDialogOpen(false);
        setFormData({
          type: 'PEMASUKAN',
          category: '',
          description: '',
          amount: '',
          date: dayjs().format('YYYY-MM-DD'),
          notes: '',
        });
        fetchTransactions();
      }
    } catch (error) {
      console.error('Failed to create transaction:', error);
    }
  };

  const canManage = ['SUPER_ADMIN', 'KETUA_RT', 'BENDAHARA'].includes(session?.user.role || '');

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
          <h1 className="text-3xl font-bold text-slate-900">Keuangan RT</h1>
          <p className="text-slate-600 mt-1">Kelola pemasukan dan pengeluaran kas RT</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={exportDialogOpen} onOpenChange={setExportDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Export PDF
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Export Laporan Keuangan</DialogTitle>
                <DialogDescription>
                  Pilih filter untuk menyesuaikan data yang akan di-export ke PDF
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                {/* Quick Filter Buttons */}
                <div className="space-y-2">
                  <Label className="text-xs text-slate-500">Filter Cepat Periode:</Label>
                  <div className="grid grid-cols-4 gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="text-xs"
                      onClick={() =>
                        setExportFilter({
                          ...exportFilter,
                          startDate: dayjs().startOf('month').format('YYYY-MM-DD'),
                          endDate: dayjs().endOf('month').format('YYYY-MM-DD'),
                        })
                      }
                    >
                      Bulan Ini
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="text-xs"
                      onClick={() =>
                        setExportFilter({
                          ...exportFilter,
                          startDate: dayjs()
                            .subtract(1, 'month')
                            .startOf('month')
                            .format('YYYY-MM-DD'),
                          endDate: dayjs()
                            .subtract(1, 'month')
                            .endOf('month')
                            .format('YYYY-MM-DD'),
                        })
                      }
                    >
                      Bulan Lalu
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="text-xs"
                      onClick={() =>
                        setExportFilter({
                          ...exportFilter,
                          startDate: dayjs().startOf('year').format('YYYY-MM-DD'),
                          endDate: dayjs().endOf('year').format('YYYY-MM-DD'),
                        })
                      }
                    >
                      Tahun Ini
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="text-xs"
                      onClick={() =>
                        setExportFilter({
                          ...exportFilter,
                          startDate: dayjs().subtract(1, 'year').startOf('year').format('YYYY-MM-DD'),
                          endDate: dayjs().subtract(1, 'year').endOf('year').format('YYYY-MM-DD'),
                        })
                      }
                    >
                      Tahun Lalu
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="startDate">Tanggal Mulai</Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={exportFilter.startDate}
                      onChange={(e) =>
                        setExportFilter({ ...exportFilter, startDate: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="endDate">Tanggal Akhir</Label>
                    <Input
                      id="endDate"
                      type="date"
                      value={exportFilter.endDate}
                      onChange={(e) =>
                        setExportFilter({ ...exportFilter, endDate: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Jenis Transaksi</Label>
                  <Select
                    value={exportFilter.type}
                    onValueChange={(value) =>
                      setExportFilter({ ...exportFilter, type: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">Semua</SelectItem>
                      <SelectItem value="PEMASUKAN">Pemasukan Saja</SelectItem>
                      <SelectItem value="PENGELUARAN">Pengeluaran Saja</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Kategori</Label>
                  <Select
                    value={exportFilter.category}
                    onValueChange={(value) =>
                      setExportFilter({ ...exportFilter, category: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">Semua Kategori</SelectItem>
                      {Array.from(new Set(transactions.map((t) => t.category))).map(
                        (cat) => (
                          <SelectItem key={cat} value={cat}>
                            {cat}
                          </SelectItem>
                        )
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                  <p className="text-sm text-slate-600 mb-1">Preview Data:</p>
                  <p className="text-xs text-slate-500">
                    {transactions.filter((t) => {
                      const transactionDate = dayjs(t.date);
                      const startDate = dayjs(exportFilter.startDate);
                      const endDate = dayjs(exportFilter.endDate);
                      const isInDateRange =
                        (transactionDate.isAfter(startDate) || transactionDate.isSame(startDate, 'day')) &&
                        (transactionDate.isBefore(endDate) || transactionDate.isSame(endDate, 'day'));
                      const isTypeMatch =
                        exportFilter.type === 'ALL' || t.type === exportFilter.type;
                      const isCategoryMatch =
                        exportFilter.category === 'ALL' ||
                        t.category === exportFilter.category;
                      return isInDateRange && isTypeMatch && isCategoryMatch;
                    }).length}{' '}
                    transaksi akan di-export
                  </p>
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setExportDialogOpen(false)}
                >
                  Batal
                </Button>
                <Button type="button" onClick={handleExportPDF}>
                  <Download className="h-4 w-4 mr-2" />
                  Export PDF
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          {canManage && (
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Tambah Transaksi
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Tambah Transaksi</DialogTitle>
                  <DialogDescription>
                    Tambahkan transaksi pemasukan atau pengeluaran kas RT
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Jenis Transaksi</Label>
                    <Select
                      value={formData.type}
                      onValueChange={(value) => setFormData({ ...formData, type: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PEMASUKAN">Pemasukan</SelectItem>
                        <SelectItem value="PENGELUARAN">Pengeluaran</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="category">Kategori</Label>
                    <Input
                      id="category"
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      placeholder="contoh: Iuran Bulanan, Kebersihan"
                      required
                      onInvalid={handleTextValidation('Kategori')}
                      onInput={resetValidation}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Keterangan</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) =>
                        setFormData({ ...formData, description: e.target.value })
                      }
                      placeholder="Deskripsi transaksi"
                      required
                      onInvalid={handleTextareaValidation('Keterangan')}
                      onInput={resetValidation}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="amount">Jumlah (Rp)</Label>
                    <Input
                      id="amount"
                      type="number"
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                      placeholder="0"
                      required
                      min={0}
                      onInvalid={handleNumberValidation('Jumlah')}
                      onInput={resetValidation}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="date">Tanggal</Label>
                    <Input
                      id="date"
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      required
                      onInvalid={handleDateValidation}
                      onInput={resetValidation}
                    />
                  </div>

                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                      Batal
                    </Button>
                    <Button type="submit">Simpan</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Saldo Kas</CardTitle>
            <Wallet className="h-5 w-5 text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">
              Rp {summary?.saldo?.toLocaleString('id-ID') || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Total Pemasukan</CardTitle>
            <TrendingUp className="h-5 w-5 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              Rp {summary?.totalPemasukan?.toLocaleString('id-ID') || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Total Pengeluaran</CardTitle>
            <TrendingDown className="h-5 w-5 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              Rp {summary?.totalPengeluaran?.toLocaleString('id-ID') || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Daftar Transaksi</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tanggal</TableHead>
                <TableHead>Jenis</TableHead>
                <TableHead>Kategori</TableHead>
                <TableHead>Keterangan</TableHead>
                <TableHead className="text-right">Jumlah</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.map((transaction) => (
                <TableRow key={transaction.id}>
                  <TableCell>
                    {dayjs(transaction.date).format('DD MMM YYYY')}
                  </TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        transaction.type === 'PEMASUKAN'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {transaction.type}
                    </span>
                  </TableCell>
                  <TableCell>{transaction.category}</TableCell>
                  <TableCell>{transaction.description}</TableCell>
                  <TableCell
                    className={`text-right font-medium ${
                      transaction.type === 'PEMASUKAN' ? 'text-green-600' : 'text-red-600'
                    }`}
                  >
                    {transaction.type === 'PEMASUKAN' ? '+' : '-'}
                    Rp {transaction.amount.toLocaleString('id-ID')}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

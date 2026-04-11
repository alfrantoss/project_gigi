'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Wallet, Users, FileText, Calendar, TrendingUp, TrendingDown } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function DashboardPage() {
  const { data: session } = useSession();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const [transactionsRes, paymentsRes, wargaRes, suratsRes] = await Promise.all([
        fetch('/api/transactions?limit=10'),
        fetch('/api/payments?limit=10'),
        fetch('/api/warga?limit=10'),
        fetch('/api/surat?limit=10'),
      ]);

      const [transactions, payments, warga, surats] = await Promise.all([
        transactionsRes.json(),
        paymentsRes.json(),
        wargaRes.json(),
        suratsRes.json(),
      ]);

      setStats({
        transactions: transactions.summary,
        totalTransactions: transactions.total,
        payments: payments.total,
        warga: warga.stats,
        surats: surats.total,
        recentTransactions: transactions.transactions,
      });
    } catch (error) {
      console.error('Failed to fetch dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900"></div>
      </div>
    );
  }

  const isAdmin = ['SUPER_ADMIN', 'KETUA_RT', 'BENDAHARA'].includes(session?.user.role || '');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-slate-600 mt-1">Selamat datang, {session?.user.name}</p>
      </div>

      {isAdmin ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-slate-600">Saldo Kas</CardTitle>
                <Wallet className="h-5 w-5 text-slate-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-slate-900">
                  Rp {stats?.transactions?.saldo?.toLocaleString('id-ID') || 0}
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Total pemasukan - pengeluaran
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-slate-600">Total Warga</CardTitle>
                <Users className="h-5 w-5 text-slate-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-slate-900">
                  {stats?.warga?.totalWarga || 0}
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  {stats?.warga?.totalActive || 0} warga aktif
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-slate-600">Tagihan Pending</CardTitle>
                <FileText className="h-5 w-5 text-slate-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-slate-900">
                  {stats?.payments || 0}
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Pembayaran belum lunas
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-slate-600">Pengajuan Surat</CardTitle>
                <Calendar className="h-5 w-5 text-slate-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-slate-900">
                  {stats?.surats || 0}
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Total pengajuan
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Pemasukan & Pengeluaran</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-green-600" />
                      <span className="text-sm text-slate-600">Total Pemasukan</span>
                    </div>
                    <span className="font-bold text-green-600">
                      Rp {stats?.transactions?.totalPemasukan?.toLocaleString('id-ID') || 0}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <TrendingDown className="h-5 w-5 text-red-600" />
                      <span className="text-sm text-slate-600">Total Pengeluaran</span>
                    </div>
                    <span className="font-bold text-red-600">
                      Rp {stats?.transactions?.totalPengeluaran?.toLocaleString('id-ID') || 0}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Transaksi Terakhir</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {stats?.recentTransactions?.slice(0, 5).map((t: any) => (
                    <div key={t.id} className="flex items-center justify-between text-sm">
                      <div>
                        <p className="font-medium text-slate-900">{t.description}</p>
                        <p className="text-xs text-slate-500">{t.category}</p>
                      </div>
                      <span
                        className={
                          t.type === 'PEMASUKAN'
                            ? 'font-medium text-green-600'
                            : 'font-medium text-red-600'
                        }
                      >
                        {t.type === 'PEMASUKAN' ? '+' : '-'}
                        Rp {t.amount.toLocaleString('id-ID')}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Tagihan Saya</CardTitle>
              <Wallet className="h-5 w-5 text-slate-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">
                {stats?.payments || 0}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Pembayaran pending
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Pengajuan Surat</CardTitle>
              <FileText className="h-5 w-5 text-slate-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">
                {stats?.surats || 0}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Total pengajuan
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Kegiatan Mendatang</CardTitle>
              <Calendar className="h-5 w-5 text-slate-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">
                0
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Minggu ini
              </p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Wallet, Users, FileText, Calendar, TrendingUp, TrendingDown, 
  AlertCircle, CheckCircle, Clock, Home, Megaphone, BarChart3 
} from 'lucide-react';
import { 
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { formatCurrency } from '@/lib/utils';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/id';

dayjs.extend(relativeTime);
dayjs.locale('id');

const COLORS = ['#10b981', '#f59e0b', '#ef4444', '#6366f1'];

export default function DashboardPage() {
  const { data: session } = useSession();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const response = await fetch('/api/dashboard/stats');
      if (!response.ok) throw new Error('Failed to fetch stats');
      const data = await response.json();
      setStats(data);
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
        <AdminDashboard stats={stats} role={session?.user.role} />
      ) : (
        <WargaDashboard stats={stats} />
      )}
    </div>
  );
}

// Admin Dashboard Component
function AdminDashboard({ stats, role }: { stats: any; role?: string }) {
  const overview = stats?.overview || {};
  
  return (
    <>
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Saldo Kas</CardTitle>
            <Wallet className="h-5 w-5 text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">
              {formatCurrency(overview.saldoKas || 0)}
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
              {overview.totalWarga || 0}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {overview.activeWarga || 0} warga aktif
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Tagihan Pending</CardTitle>
            <AlertCircle className="h-5 w-5 text-orange-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {overview.totalPendingPayments || 0}
            </div>
            <p className="text-xs text-red-600 mt-1">
              {overview.totalOverduePayments || 0} overdue
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
              {overview.pendingSurats || 0}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Menunggu approval
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Financial Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Total Pemasukan</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              <span className="text-xl font-bold text-green-600">
                {formatCurrency(overview.totalPemasukan || 0)}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Total Pengeluaran</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <TrendingDown className="h-5 w-5 text-red-600" />
              <span className="text-xl font-bold text-red-600">
                {formatCurrency(overview.totalPengeluaran || 0)}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Total Hutang Warga</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-orange-600" />
              <span className="text-xl font-bold text-orange-600">
                {formatCurrency(overview.totalDebt || 0)}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Income/Expense Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Pemasukan & Pengeluaran (6 Bulan Terakhir)</CardTitle>
            <CardDescription>Grafik keuangan bulanan</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={stats?.monthlyChartData || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value: any) => formatCurrency(value)} />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="pemasukan" 
                  stroke="#10b981" 
                  strokeWidth={2}
                  name="Pemasukan"
                />
                <Line 
                  type="monotone" 
                  dataKey="pengeluaran" 
                  stroke="#ef4444" 
                  strokeWidth={2}
                  name="Pengeluaran"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Warga Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Statistik Warga per Status</CardTitle>
            <CardDescription>Distribusi status warga</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={stats?.wargaByStatus || []}
                  dataKey="count"
                  nameKey="status"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label={(entry) => `${entry.status}: ${entry.count}`}
                >
                  {(stats?.wargaByStatus || []).map((_: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Top Debtors (for Bendahara) */}
      {role === 'BENDAHARA' && stats?.topDebtors?.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Top 10 Warga dengan Hutang Terbanyak</CardTitle>
            <CardDescription>Prioritas penagihan</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.topDebtors.map((debtor: any, index: number) => (
                <div key={index} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-8 h-8 bg-slate-200 rounded-full text-sm font-bold">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">{debtor.name}</p>
                      <p className="text-xs text-slate-500">Rumah No. {debtor.nomorRumah}</p>
                    </div>
                  </div>
                  <span className="font-bold text-red-600">
                    {formatCurrency(debtor.totalDebt)}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Transactions */}
        <Card>
          <CardHeader>
            <CardTitle>Transaksi Terakhir</CardTitle>
            <CardDescription>10 transaksi terbaru</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats?.recentTransactions?.slice(0, 10).map((t: any) => (
                <div key={t.id} className="flex items-center justify-between text-sm border-b pb-2">
                  <div className="flex-1">
                    <p className="font-medium text-slate-900">{t.description}</p>
                    <p className="text-xs text-slate-500">{t.category} • {dayjs(t.date).format('DD MMM YYYY')}</p>
                  </div>
                  <span className={t.type === 'PEMASUKAN' ? 'font-medium text-green-600' : 'font-medium text-red-600'}>
                    {t.type === 'PEMASUKAN' ? '+' : '-'}{formatCurrency(t.amount)}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Activities */}
        <Card>
          <CardHeader>
            <CardTitle>Kegiatan Mendatang</CardTitle>
            <CardDescription>Agenda 30 hari ke depan</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats?.upcomingActivities?.length > 0 ? (
                stats.upcomingActivities.map((activity: any) => (
                  <div key={activity.id} className="flex gap-3 p-3 bg-slate-50 rounded-lg">
                    <Calendar className="h-5 w-5 text-blue-600 flex-shrink-0 mt-1" />
                    <div className="flex-1">
                      <p className="font-medium text-slate-900">{activity.title}</p>
                      <p className="text-xs text-slate-600 mt-1">{activity.description}</p>
                      <div className="flex items-center gap-2 mt-2 text-xs text-slate-500">
                        <Clock className="h-3 w-3" />
                        {dayjs(activity.startDate).format('DD MMM YYYY, HH:mm')}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-500 text-center py-4">Belum ada kegiatan terjadwal</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Announcements */}
      <Card>
        <CardHeader>
          <CardTitle>Pengumuman Terbaru</CardTitle>
          <CardDescription>Informasi penting untuk warga</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {stats?.recentAnnouncements?.length > 0 ? (
              stats.recentAnnouncements.map((announcement: any) => (
                <div key={announcement.id} className="flex gap-3 p-4 border rounded-lg">
                  <Megaphone className="h-5 w-5 text-blue-600 flex-shrink-0 mt-1" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium text-slate-900">{announcement.title}</p>
                      {announcement.priority === 'high' && (
                        <Badge variant="destructive" className="text-xs">Penting</Badge>
                      )}
                    </div>
                    <p className="text-sm text-slate-600">{announcement.content}</p>
                    <p className="text-xs text-slate-500 mt-2">
                      {dayjs(announcement.createdAt).fromNow()} • oleh {announcement.user.name}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-500 text-center py-4">Belum ada pengumuman</p>
            )}
          </div>
        </CardContent>
      </Card>
    </>
  );
}

// Warga Dashboard Component
function WargaDashboard({ stats }: { stats: any }) {
  const wargaInfo = stats?.wargaInfo;

  return (
    <>
      {/* Personal Info Card */}
      <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
        <CardHeader>
          <CardTitle className="text-white">Informasi Rumah Saya</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-3">
              <Home className="h-8 w-8" />
              <div>
                <p className="text-sm opacity-90">Nomor Rumah</p>
                <p className="text-2xl font-bold">{wargaInfo?.nomorRumah || '-'}</p>
              </div>
            </div>
            <div>
              <p className="text-sm opacity-90">Alamat</p>
              <p className="font-medium">{wargaInfo?.alamat || '-'}</p>
            </div>
            <div>
              <p className="text-sm opacity-90">Status</p>
              <Badge className="bg-white text-blue-600 hover:bg-white">
                {wargaInfo?.status || 'AKTIF'}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Financial Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Iuran Bulanan</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">
              {formatCurrency(wargaInfo?.monthlyFee || 0)}
            </div>
            <p className="text-xs text-slate-500 mt-1">Per bulan</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Total Terbayar</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(stats?.totalPaid || 0)}
            </div>
            <p className="text-xs text-slate-500 mt-1">Sudah dibayar</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Sisa Hutang</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(stats?.totalDebt || 0)}
            </div>
            <p className="text-xs text-slate-500 mt-1">Belum dibayar</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Tagihan Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {stats?.pendingPayments || 0}
            </div>
            <p className="text-xs text-slate-500 mt-1">Perlu dibayar</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Payment Status Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Status Pembayaran Saya</CardTitle>
            <CardDescription>Perbandingan sudah dibayar vs hutang</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={[
                    { name: 'Terbayar', value: stats?.totalPaid || 0 },
                    { name: 'Hutang', value: stats?.totalDebt || 0 },
                  ]}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={(entry) => `${entry.name}: ${formatCurrency(entry.value)}`}
                >
                  <Cell fill="#10b981" />
                  <Cell fill="#ef4444" />
                </Pie>
                <Tooltip formatter={(value: any) => formatCurrency(value)} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Surat Status */}
        <Card>
          <CardHeader>
            <CardTitle>Pengajuan Surat</CardTitle>
            <CardDescription>Status surat yang diajukan</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-orange-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-orange-600" />
                  <span className="font-medium text-slate-900">Menunggu Approval</span>
                </div>
                <span className="text-2xl font-bold text-orange-600">
                  {stats?.pendingSurats || 0}
                </span>
              </div>
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-slate-600" />
                  <span className="font-medium text-slate-900">Total Pengajuan</span>
                </div>
                <span className="text-2xl font-bold text-slate-900">
                  {stats?.totalSurats || 0}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Activities */}
      <Card>
        <CardHeader>
          <CardTitle>Kegiatan RT Mendatang</CardTitle>
          <CardDescription>Jangan lewatkan kegiatan penting!</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {stats?.upcomingActivities?.length > 0 ? (
              stats.upcomingActivities.map((activity: any) => (
                <div key={activity.id} className="flex gap-3 p-4 border rounded-lg hover:bg-slate-50 transition-colors">
                  <Calendar className="h-5 w-5 text-blue-600 flex-shrink-0 mt-1" />
                  <div className="flex-1">
                    <p className="font-medium text-slate-900">{activity.title}</p>
                    <p className="text-sm text-slate-600 mt-1">{activity.description}</p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {dayjs(activity.startDate).format('DD MMM YYYY, HH:mm')}
                      </div>
                      {activity.location && <span>📍 {activity.location}</span>}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-500 text-center py-8">Belum ada kegiatan terjadwal</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Announcements */}
      <Card>
        <CardHeader>
          <CardTitle>Pengumuman Terbaru</CardTitle>
          <CardDescription>Informasi penting dari pengurus RT</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {stats?.recentAnnouncements?.length > 0 ? (
              stats.recentAnnouncements.map((announcement: any) => (
                <div key={announcement.id} className="flex gap-3 p-4 border rounded-lg">
                  <Megaphone className="h-5 w-5 text-blue-600 flex-shrink-0 mt-1" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium text-slate-900">{announcement.title}</p>
                      {announcement.priority === 'high' && (
                        <Badge variant="destructive" className="text-xs">Penting</Badge>
                      )}
                    </div>
                    <p className="text-sm text-slate-600">{announcement.content}</p>
                    <p className="text-xs text-slate-500 mt-2">
                      {dayjs(announcement.createdAt).fromNow()}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-500 text-center py-8">Belum ada pengumuman</p>
            )}
          </div>
        </CardContent>
      </Card>
    </>
  );
}

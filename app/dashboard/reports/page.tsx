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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Line, Bar } from "react-chartjs-2";
import {
  ArrowUp,
  ArrowDown,
  Users,
  DollarSign,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
);

interface ReportData {
  summary: {
    totalPayments: number;
    paidPayments: number;
    pendingPayments: number;
    overduePayments: number;
    totalWarga: number;
    aktifWarga: number;
  };
  financial: {
    paidAmount: number;
    pendingAmount: number;
    overdueAmount: number;
    pemasukan: number;
    pengeluaran: number;
  };
  topDebtors: Array<{
    id: string;
    totalDebt: number;
    user: { name: string; email: string };
  }>;
  paymentTrends: Array<{
    period: string;
    _sum: { amount: number };
    _count: number;
  }>;
}

export default function ReportsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 3);
    return d.toISOString().split("T")[0];
  });
  const [endDate, setEndDate] = useState(
    new Date().toISOString().split("T")[0],
  );

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/login");
      return;
    }

    if (status === "authenticated") {
      if (
        !["SUPER_ADMIN", "KETUA_RT", "BENDAHARA"].includes(
          session?.user?.role || "",
        )
      ) {
        router.push("/dashboard");
        return;
      }
      fetchReports();
    }
  }, [status, session, router]);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        startDate,
        endDate,
      });

      const response = await fetch(`/api/reports/summary?${params}`, {
        method: "GET",
      });

      if (!response.ok) throw new Error("Failed to fetch reports");
      const data = await response.json();
      setReportData(data);
    } catch (error) {
      console.error("Fetch reports error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDateChange = () => {
    fetchReports();
  };

  if (loading || !reportData) {
    return <div className="p-8">Loading...</div>;
  }

  const collectionRate =
    reportData.summary.totalPayments > 0
      ? (
          (reportData.summary.paidPayments / reportData.summary.totalPayments) *
          100
        ).toFixed(1)
      : 0;

  const netBalance =
    reportData.financial.pemasukan - reportData.financial.pengeluaran;

  const chartData = {
    labels: reportData.paymentTrends.map((t) => t.period).reverse(),
    datasets: [
      {
        label: "Pendapatan Iuran",
        data: reportData.paymentTrends.map((t) => t._sum.amount).reverse(),
        borderColor: "rgb(75, 192, 192)",
        backgroundColor: "rgba(75, 192, 192, 0.5)",
        tension: 0.1,
      },
    ],
  };

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Laporan Keuangan</h1>
        <p className="text-slate-600">
          Dashboard analitik dan pelaporan sistem
        </p>
      </div>

      {/* Date Filter */}
      <div className="flex gap-4 items-end">
        <div>
          <label className="block text-sm font-medium mb-2">
            Tanggal Mulai
          </label>
          <Input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-40"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">
            Tanggal Akhir
          </label>
          <Input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-40"
          />
        </div>
        <Button onClick={handleDateChange}>Tampilkan Laporan</Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Payment Collection */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">
              Koleksi Pembayaran
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-2xl font-bold text-green-600">
                  {collectionRate}%
                </span>
                <CheckCircle className="text-green-600 w-5 h-5" />
              </div>
              <p className="text-xs text-slate-600">
                {reportData.summary.paidPayments} dari{" "}
                {reportData.summary.totalPayments} pembayaran
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Pending Payments */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">
              Tagihan Tertunda
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-2xl font-bold text-yellow-600">
                  {reportData.summary.pendingPayments}
                </span>
                <ArrowDown className="text-yellow-600 w-5 h-5" />
              </div>
              <p className="text-xs text-slate-600">
                {formatCurrency(reportData.financial.pendingAmount)} total
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Overdue Payments */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">
              Tagihan Terlambat
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-2xl font-bold text-red-600">
                  {reportData.summary.overduePayments}
                </span>
                <AlertCircle className="text-red-600 w-5 h-5" />
              </div>
              <p className="text-xs text-slate-600">
                {formatCurrency(reportData.financial.overdueAmount)} total
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Total Revenue */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">
              Total Pemasukan
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-2xl font-bold text-blue-600">
                  {formatCurrency(reportData.financial.pemasukan)}
                </span>
                <ArrowUp className="text-blue-600 w-5 h-5" />
              </div>
              <p className="text-xs text-slate-600">Periode terpilih</p>
            </div>
          </CardContent>
        </Card>

        {/* Total Expenses */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">
              Total Pengeluaran
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-2xl font-bold text-red-600">
                  {formatCurrency(reportData.financial.pengeluaran)}
                </span>
                <ArrowDown className="text-red-600 w-5 h-5" />
              </div>
              <p className="text-xs text-slate-600">Periode terpilih</p>
            </div>
          </CardContent>
        </Card>

        {/* Net Balance */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Saldo Bersih</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span
                  className={`text-2xl font-bold ${netBalance >= 0 ? "text-green-600" : "text-red-600"}`}
                >
                  {formatCurrency(netBalance)}
                </span>
                {netBalance >= 0 ? (
                  <ArrowUp className="text-green-600 w-5 h-5" />
                ) : (
                  <ArrowDown className="text-red-600 w-5 h-5" />
                )}
              </div>
              <p className="text-xs text-slate-600">Pemasukan - Pengeluaran</p>
            </div>
          </CardContent>
        </Card>

        {/* Warga Stats */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Warga</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-2xl font-bold text-purple-600">
                  {reportData.summary.totalWarga}
                </span>
                <Users className="text-purple-600 w-5 h-5" />
              </div>
              <p className="text-xs text-slate-600">
                {reportData.summary.aktifWarga} warga aktif
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Payment Trend Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Tren Pembayaran Bulanan</CardTitle>
            <CardDescription>
              Grafik penerimaan iuran 12 bulan terakhir
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Line
              data={chartData}
              options={{
                responsive: true,
                plugins: {
                  legend: { display: true },
                  title: { display: false },
                },
                scales: {
                  y: { beginAtZero: true },
                },
              }}
            />
          </CardContent>
        </Card>

        {/* Financial Summary Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Ringkasan Keuangan</CardTitle>
            <CardDescription>
              Perbandingan pemasukan dan pengeluaran
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Bar
              data={{
                labels: ["Pemasukan", "Pengeluaran"],
                datasets: [
                  {
                    label: "Jumlah (Rp)",
                    data: [
                      reportData.financial.pemasukan,
                      reportData.financial.pengeluaran,
                    ],
                    backgroundColor: [
                      "rgba(75, 192, 192, 0.6)",
                      "rgba(255, 99, 132, 0.6)",
                    ],
                  },
                ],
              }}
              options={{
                responsive: true,
                plugins: {
                  legend: { display: true },
                },
                scales: {
                  y: { beginAtZero: true },
                },
              }}
            />
          </CardContent>
        </Card>
      </div>

      {/* Top Debtors Table */}
      <Card>
        <CardHeader>
          <CardTitle>Daftar Debitur Terbesar (Top 5)</CardTitle>
          <CardDescription>Warga dengan hutang terbesar</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>No. Rumah / Nama</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead className="text-right">Total Hutang</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reportData.topDebtors.map((debtor, idx) => (
                  <TableRow key={debtor.id}>
                    <TableCell className="font-medium">
                      {idx + 1}. {debtor.user.name}
                    </TableCell>
                    <TableCell>{debtor.user.email}</TableCell>
                    <TableCell className="text-right font-semibold text-red-600">
                      {formatCurrency(debtor.totalDebt)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

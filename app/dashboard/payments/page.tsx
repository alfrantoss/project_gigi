"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
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
import { Badge } from "@/components/ui/badge";
import { Receipt, CreditCard, Loader2, AlertTriangle } from "lucide-react";
import dayjs from "dayjs";
import "dayjs/locale/id";
import { useToast } from "@/hooks/use-toast";

dayjs.locale("id");

const statusColors = {
  PENDING: "bg-yellow-100 text-yellow-800",
  PAID: "bg-green-100 text-green-800",
  FAILED: "bg-red-100 text-red-800",
  OVERDUE: "bg-red-100 text-red-800",
};

const statusLabels = {
  PENDING: "Pending",
  PAID: "Lunas",
  FAILED: "Gagal",
  OVERDUE: "Terlambat",
};

// Helper function to calculate days overdue
function getDaysOverdue(dueDate: string): number {
  const now = dayjs();
  const due = dayjs(dueDate);
  return now.diff(due, "day");
}

function formatOverdueMessage(daysOverdue: number): string {
  if (daysOverdue <= 0) {
    return "Belum jatuh tempo";
  } else if (daysOverdue === 1) {
    return "1 hari terlambat";
  } else if (daysOverdue < 30) {
    return `${daysOverdue} hari terlambat`;
  } else {
    const months = Math.floor(daysOverdue / 30);
    return `${months} bulan ${daysOverdue % 30} hari terlambat`;
  }
}

export default function PaymentsPage() {
  const { data: session } = useSession();
  const { toast } = useToast();
  const [payments, setPayments] = useState<any[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    paid: 0,
    overdue: 0,
  });
  const [loading, setLoading] = useState(true);
  const [payingId, setPayingId] = useState<string | null>(null);

  useEffect(() => {
    fetchPayments();
    // Load Midtrans Snap script
    const script = document.createElement("script");
    script.src = "https://app.sandbox.midtrans.com/snap/snap.js";
    script.setAttribute("data-client-key", "Mid-client-u8ARB71uoJlfWhJe");
    document.body.appendChild(script);
  }, []);

  const fetchPayments = async () => {
    try {
      const response = await fetch("/api/payments");
      const data = await response.json();
      setPayments(data.payments);

      const statsData = {
        total: data.total,
        pending: data.payments.filter((p: any) => p.status === "PENDING")
          .length,
        paid: data.payments.filter((p: any) => p.status === "PAID").length,
        overdue: data.payments.filter((p: any) => p.status === "OVERDUE")
          .length,
      };
      setStats(statsData);
    } catch (error) {
      console.error("Failed to fetch payments:", error);
      toast({
        title: "Error",
        description: "Gagal mengambil data pembayaran",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePayNow = async (paymentId: string) => {
    setPayingId(paymentId);
    try {
      const response = await fetch(`/api/payments/${paymentId}`, {
        method: "POST",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Gagal membuat transaksi");
      }

      const data = await response.json();

      if (data.token) {
        // Try to use Midtrans Snap if available
        if (typeof window !== "undefined" && (window as any).snap) {
          (window as any).snap.pay(data.token, {
            onSuccess: async function (result: any) {
              console.log("Payment success:", result);
              try {
                // Process payment on server
                const processResponse = await fetch("/api/payments/process", {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({
                    orderId: result.order_id || data.orderId,
                    transactionStatus: "settlement",
                  }),
                });

                if (processResponse.ok) {
                  toast({
                    title: "Sukses",
                    description: "Pembayaran berhasil diproses",
                  });
                  // Refresh payments list
                  setTimeout(() => {
                    fetchPayments();
                    setPayingId(null);
                  }, 1000);
                } else {
                  toast({
                    title: "Peringatan",
                    description:
                      "Pembayaran diterima tapi ada masalah update status",
                    variant: "destructive",
                  });
                  fetchPayments();
                  setPayingId(null);
                }
              } catch (error: any) {
                console.error("Process payment error:", error);
                toast({
                  title: "Peringatan",
                  description:
                    "Pembayaran diterima tapi ada masalah update status",
                  variant: "destructive",
                });
                fetchPayments();
                setPayingId(null);
              }
            },
            onPending: function (result: any) {
              console.log("Payment pending:", result);
              toast({
                title: "Menunggu",
                description: "Pembayaran sedang diproses",
              });
              setPayingId(null);
            },
            onError: function (result: any) {
              console.log("Payment error:", result);
              toast({
                title: "Gagal",
                description: "Pembayaran gagal",
                variant: "destructive",
              });
              setPayingId(null);
            },
            onClose: function () {
              console.log("Snap payment dialog is closed");
              // Check payment status with Midtrans after dialog closes
              setTimeout(async () => {
                try {
                  const checkResponse = await fetch(
                    "/api/payments/check-status",
                    {
                      method: "POST",
                      headers: {
                        "Content-Type": "application/json",
                      },
                      body: JSON.stringify({
                        orderId: data.orderId,
                      }),
                    },
                  );

                  if (checkResponse.ok) {
                    const result = await checkResponse.json();
                    console.log("Payment status check result:", result);

                    if (result.status === "PAID") {
                      toast({
                        title: "Sukses",
                        description: "Pembayaran berhasil diproses",
                      });
                    }
                  }
                } catch (error: any) {
                  console.error("Status check error:", error);
                }

                // Refresh payments list
                fetchPayments();
                setPayingId(null);
              }, 1500);
            },
          });
        } else {
          // Fallback: redirect to processing page
          window.location.href = `/dashboard/payments/processing/${paymentId}`;
        }
      }
    } catch (error: any) {
      console.error("Payment error:", error);
      toast({
        title: "Error",
        description: error.message || "Gagal melakukan pembayaran",
        variant: "destructive",
      });
      setPayingId(null);
    }
  };

  const isWarga = session?.user.role === "WARGA";

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
            {isWarga ? "Tagihan Saya" : "Manajemen Pembayaran"}
          </h1>
          <p className="text-slate-600 mt-1">
            {isWarga
              ? "Lihat dan bayar tagihan iuran RT Anda"
              : "Kelola tagihan dan pembayaran warga"}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">
              Total Tagihan
            </CardTitle>
            <Receipt className="h-5 w-5 text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">
              {stats.total}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">
              Pending
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {stats.pending}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">
              Lunas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {stats.paid}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">
              Terlambat
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {stats.overdue}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Daftar Pembayaran</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                {!isWarga && <TableHead>Nama Warga</TableHead>}
                <TableHead>Periode</TableHead>
                <TableHead>Keterangan</TableHead>
                <TableHead>Jatuh Tempo</TableHead>
                <TableHead className="text-right">Jumlah</TableHead>
                <TableHead>Status</TableHead>
                {isWarga && <TableHead>Aksi</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {payments.map((payment) => {
                const daysOverdue = getDaysOverdue(payment.dueDate);
                const isOverdue =
                  payment.status === "OVERDUE" && daysOverdue > 0;

                return (
                  <TableRow
                    key={payment.id}
                    className={isOverdue ? "bg-red-50" : ""}
                  >
                    {!isWarga && <TableCell>{payment.user.name}</TableCell>}
                    <TableCell className="font-medium">
                      {payment.period}
                    </TableCell>
                    <TableCell>{payment.description}</TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <span>
                          {dayjs(payment.dueDate).format("DD MMM YYYY")}
                        </span>
                        {isOverdue && (
                          <div className="flex items-center gap-1 text-xs text-red-600 font-medium">
                            <AlertTriangle className="h-3 w-3" />
                            {formatOverdueMessage(daysOverdue)}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      Rp {payment.amount.toLocaleString("id-ID")}
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={
                          statusColors[
                            payment.status as keyof typeof statusColors
                          ]
                        }
                      >
                        {
                          statusLabels[
                            payment.status as keyof typeof statusLabels
                          ]
                        }
                      </Badge>
                    </TableCell>
                    {isWarga && (
                      <TableCell>
                        {payment.status === "PENDING" ||
                        payment.status === "OVERDUE" ? (
                          <Button
                            size="sm"
                            onClick={() => handlePayNow(payment.id)}
                            disabled={payingId !== null}
                          >
                            {payingId === payment.id && (
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            )}
                            {payingId === payment.id ? (
                              "Memproses..."
                            ) : (
                              <>
                                <CreditCard className="h-4 w-4 mr-2" />
                                Bayar
                              </>
                            )}
                          </Button>
                        ) : (
                          <span className="text-sm text-slate-500">-</span>
                        )}
                      </TableCell>
                    )}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

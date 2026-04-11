"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function PaymentFinishPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [status, setStatus] = useState<"loading" | "success" | "failed">(
    "loading",
  );
  const [message, setMessage] = useState("");

  useEffect(() => {
    const processPayment = async () => {
      try {
        // Get order ID from query params
        const orderId = searchParams.get("order_id");
        const transactionStatus = searchParams.get("transaction_status");

        console.log("Payment Finish:", { orderId, transactionStatus });

        if (!orderId) {
          setStatus("failed");
          setMessage("Order ID tidak ditemukan");
          return;
        }

        // Call API to process payment based on Midtrans response
        const response = await fetch("/api/payments/process", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            orderId,
            transactionStatus,
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          setStatus("failed");
          setMessage(error.error || "Gagal memproses pembayaran");
          return;
        }

        const result = await response.json();

        if (result.success) {
          setStatus("success");
          setMessage("Pembayaran Anda telah berhasil diproses");

          toast({
            title: "Sukses",
            description: "Pembayaran berhasil diproses",
          });

          // Redirect back to payments page after 3 seconds
          setTimeout(() => {
            router.push("/dashboard/payments");
          }, 3000);
        } else {
          setStatus("failed");
          setMessage(
            result.message || "Pembayaran gagal atau dalam status pending",
          );

          toast({
            title: "Gagal",
            description: result.message || "Pembayaran gagal diproses",
            variant: "destructive",
          });
        }
      } catch (error: any) {
        console.error("Payment process error:", error);
        setStatus("failed");
        setMessage(
          error.message || "Terjadi kesalahan saat memproses pembayaran",
        );
      }
    };

    processPayment();
  }, [searchParams, router, toast]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center">Status Pembayaran</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {status === "loading" && (
            <div className="flex flex-col items-center space-y-4">
              <Loader2 className="h-12 w-12 text-blue-600 animate-spin" />
              <p className="text-slate-600 text-center">
                Memverifikasi pembayaran...
              </p>
            </div>
          )}

          {status === "success" && (
            <div className="flex flex-col items-center space-y-4">
              <CheckCircle className="h-12 w-12 text-green-600" />
              <div className="text-center">
                <p className="font-semibold text-slate-900">
                  Pembayaran Berhasil!
                </p>
                <p className="text-sm text-slate-600 mt-2">{message}</p>
              </div>
              <p className="text-xs text-slate-500 text-center">
                Anda akan diarahkan kembali ke halaman tagihan dalam 3 detik...
              </p>
              <Button
                onClick={() => router.push("/dashboard/payments")}
                className="w-full"
              >
                Kembali ke Tagihan
              </Button>
            </div>
          )}

          {status === "failed" && (
            <div className="flex flex-col items-center space-y-4">
              <AlertCircle className="h-12 w-12 text-red-600" />
              <div className="text-center">
                <p className="font-semibold text-slate-900">Pembayaran Gagal</p>
                <p className="text-sm text-slate-600 mt-2">{message}</p>
              </div>
              <Button
                onClick={() => router.push("/dashboard/payments")}
                className="w-full"
                variant="outline"
              >
                Kembali
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

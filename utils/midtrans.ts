import { prisma } from "@/lib/prisma";

export async function createMidtransTransaction(paymentId: string) {
  try {
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        user: true,
      },
    });

    if (!payment) {
      throw new Error("Payment not found");
    }

    const serverKey = process.env.MIDTRANS_SERVER_KEY;

    if (!serverKey) {
      throw new Error("Midtrans server key not configured");
    }

    const orderId = `RT-${Date.now()}-${paymentId.substring(0, 8)}`;
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || "http://localhost:3000";

    // Log untuk debugging
    console.log('=== Midtrans Transaction Setup ===');
    console.log('Base URL:', baseUrl);
    console.log('Finish Redirect:', `${baseUrl}/dashboard/payments`);

    const payload = {
      transaction_details: {
        order_id: orderId,
        gross_amount: payment.amount,
      },
      customer_details: {
        first_name: payment.user.name,
        email: payment.user.email,
        phone: payment.user.phone,
      },
      item_details: [
        {
          id: paymentId,
          price: payment.amount,
          quantity: 1,
          name: payment.description,
        },
      ],
      callbacks: {
        finish: `${baseUrl}/dashboard/payments`,
        error: `${baseUrl}/dashboard/payments`,
        pending: `${baseUrl}/dashboard/payments`,
      },
    };

    const response = await fetch(
      "https://app.sandbox.midtrans.com/snap/v1/transactions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Basic ${Buffer.from(serverKey + ":").toString("base64")}`,
        },
        body: JSON.stringify(payload),
      },
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        `Midtrans API error: ${data.error_id || response.status} - ${data.error_message || "Unknown error"}`,
      );
    }

    if (data.token) {
      await prisma.payment.update({
        where: { id: paymentId },
        data: {
          midtransOrderId: orderId,
        },
      });
    } else {
      throw new Error("No token received from Midtrans");
    }

    return {
      success: true,
      token: data.token,
      redirectUrl: data.redirect_url,
      orderId,
    };
  } catch (error: any) {
    console.error("Failed to create Midtrans transaction:", error);
    return { success: false, error: error.message || String(error) };
  }
}

export async function handleMidtransNotification(notification: any) {
  try {
    const orderId = notification.order_id;
    const transactionStatus = notification.transaction_status;
    const fraudStatus = notification.fraud_status;

    const payment = await prisma.payment.findFirst({
      where: { midtransOrderId: orderId },
    });

    if (!payment) {
      throw new Error("Payment not found");
    }

    let status: "PAID" | "FAILED" | "PENDING" = "PENDING";

    if (transactionStatus === "capture") {
      if (fraudStatus === "accept") {
        status = "PAID";
      }
    } else if (transactionStatus === "settlement") {
      status = "PAID";
    } else if (
      transactionStatus === "cancel" ||
      transactionStatus === "deny" ||
      transactionStatus === "expire"
    ) {
      status = "FAILED";
    } else if (transactionStatus === "pending") {
      status = "PENDING";
    }

    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status,
        transactionId: notification.transaction_id,
        paymentMethod: notification.payment_type,
        paidAt: status === "PAID" ? new Date() : null,
      },
    });

    if (status === "PAID") {
      const warga = await prisma.warga.findUnique({
        where: { userId: payment.userId },
      });

      if (warga) {
        await prisma.warga.update({
          where: { id: warga.id },
          data: {
            totalPaid: warga.totalPaid + payment.amount,
            totalDebt: Math.max(0, warga.totalDebt - payment.amount),
            lastPayment: new Date(),
          },
        });
      }
    }

    return { success: true, status };
  } catch (error) {
    console.error("Failed to handle Midtrans notification:", error);
    return { success: false, error };
  }
}

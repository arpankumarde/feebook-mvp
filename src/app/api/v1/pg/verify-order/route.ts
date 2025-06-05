import { NextRequest, NextResponse } from "next/server";
import cashfree from "@/lib/cfpg_server";
import db from "@/lib/db";
import {
  Order,
  OrderStatus,
  PaymentStatus,
  Prisma,
  Transaction,
} from "@prisma/client";
import { PaymentEntity } from "cashfree-pg";
import { AxiosResponse } from "axios";

interface ExtendedPayment extends PaymentEntity {
  payment_offers: Prisma.JsonValue[] | null;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const orderId = searchParams.get("orderId") ?? "";

  try {
    const { data: order } = await cashfree.PGFetchOrder(orderId);

    let createdOrder: Order[];
    if (!order.order_status && !order?.order_tags?.feePlanId) {
      return NextResponse.json(order, { status: 500 });
    } else {
      createdOrder = await db.order.updateManyAndReturn({
        where: {
          id: orderId,
        },
        data: {
          status: order.order_status as OrderStatus,
        },
      });

      if ((order?.order_status as OrderStatus) === "PAID") {
        await db.feePlan.update({
          where: {
            id: order?.order_tags?.feePlanId as string,
          },
          data: {
            status: "PAID",
          },
        });
      }
    }

    const { data: payments } = (await cashfree.PGOrderFetchPayments(
      orderId
    )) as AxiosResponse<ExtendedPayment[], any>;
    const paymentDbFormat: Prisma.TransactionCreateManyInput[] = payments.map(
      (payment) => ({
        orderId: payment?.order_id || orderId,
        feePlanId: order?.order_tags?.feePlanId,
        consumerId: order?.order_tags?.consumerId,
        externalPaymentId: payment?.cf_payment_id ?? "",
        amount: payment?.payment_amount || 0,
        status: payment?.payment_status as PaymentStatus,
        paymentTime: payment?.payment_time,
        paymentCurrency: payment?.payment_currency ?? "INR",
        paymentMessage: payment?.payment_message,
        bankReference: payment?.bank_reference,
        paymentMethod: payment?.payment_method
          ? JSON.parse(JSON.stringify(payment?.payment_method))
          : null,
        paymentGroup: payment?.payment_group,
        paymentSurcharge: payment?.payment_surcharge
          ? JSON.parse(JSON.stringify(payment?.payment_surcharge))
          : null,
        paymentGateway:
          payment?.payment_gateway_details?.gateway_name ?? "CASHFREE",
        paymentGatewayDetails: payment?.payment_gateway_details
          ? JSON.parse(JSON.stringify(payment?.payment_gateway_details))
          : null,
        paymentOffers: payment?.payment_offers
          ? Array.isArray(payment.payment_offers)
            ? JSON.parse(JSON.stringify(payment.payment_offers))
            : JSON.parse(JSON.stringify([payment.payment_offers]))
          : [],
        errorDetails: payment?.error_details
          ? JSON.parse(JSON.stringify(payment?.error_details))
          : null,
        source: "GETAPI",
      })
    );

    let createdTransactions: Transaction[] = [];
    if (paymentDbFormat.length > 0) {
      createdTransactions = await db.transaction.createManyAndReturn({
        data: paymentDbFormat,
        skipDuplicates: true,
      });
    }

    if (createdTransactions.length === 0) {
      createdTransactions = await db.transaction.findMany({
        where: {
          orderId: orderId,
        },
        orderBy: {
          paymentTime: "desc",
        },
      });
    }

    return NextResponse.json({
      order: createdOrder[0],
      payments: createdTransactions,
    });
  } catch (error: any) {
    console.error("Error fetching order details:", error);
    return NextResponse.json(error.response.data.message, {
      status: 500,
    });
  }
}

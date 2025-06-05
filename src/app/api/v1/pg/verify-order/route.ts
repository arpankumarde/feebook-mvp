import { NextRequest, NextResponse } from "next/server";
import cashfree from "@/lib/cfpg_server";
import db from "@/lib/db";
import {
  FeePlan,
  Member,
  Order,
  OrderStatus,
  PaymentStatus,
  Prisma,
  Provider,
  Transaction,
} from "@prisma/client";
import { PaymentEntity } from "cashfree-pg";
import { AxiosResponse } from "axios";
import ivSuite from "@/lib/invoiceSuite";
import {
  GenerateInvoiceDto,
  GenerateInvoiceResponseDto,
} from "@/types/invoiceSuite";

interface ExtendedPayment extends PaymentEntity {
  payment_offers: Prisma.JsonValue[] | null;
}

export interface ExtendedOrder extends Order {
  feePlan: FeePlan & {
    provider: Provider;
    member: Member;
  };
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const orderId = searchParams.get("orderId") ?? "";

  try {
    const { data: order } = await cashfree.PGFetchOrder(orderId);

    let createdOrder: ExtendedOrder[];
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
        include: {
          feePlan: {
            include: {
              provider: true,
              member: true,
            },
          },
        },
      });
    }

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

    if (!createdOrder[0]?.feePlan?.receipt) {
      const ivSuiteProps: GenerateInvoiceDto = {
        filename: `${order?.cf_order_id}-${payments[0]?.cf_payment_id}`,
        p1: createdOrder[0].feePlan.provider.name,
        p2: createdOrder[0].feePlan.provider.email,
        p3: createdOrder[0].feePlan.provider.phone,
        p4: `Code: ${createdOrder[0].feePlan.provider.code}`,
        p5: order?.cf_order_id ?? "",
        p6: payments[0]?.cf_payment_id ?? "",
        p7: payments[0]?.payment_time
          ? new Date(payments[0]?.payment_time).toDateString()
          : "",
        p8:
          Object.keys(payments[0]?.payment_method || {})
            .join(", ")
            .toUpperCase() || "",
        p9: `${createdOrder[0].feePlan.member.firstName} ${createdOrder[0].feePlan.member.lastName}`,
        p10: createdOrder[0].feePlan.member.uniqueId,
        p11: createdOrder[0].feePlan.member.category ?? "",
        p12: createdOrder[0].feePlan.member.phone,
        p13: createdOrder[0].feePlan.name,
        p14: payments[0]?.order_amount?.toString() ?? "0",
        note: order?.order_note,
      };
      try {
        const { data } = await ivSuite.post<GenerateInvoiceResponseDto>(
          "/pdf",
          ivSuiteProps
        );

        if (data.success && data.url) {
          await db.feePlan.update({
            where: {
              id: order?.order_tags?.feePlanId as string,
            },
            data: {
              receipt: data.url,
            },
          });
          createdOrder[0].feePlan.receipt = data.url;
        } else {
          console.error("Failed to generate invoice:", data.error);
        }
      } catch (error) {
        console.error("Error generating invoice:", error);
      }
    }

    return NextResponse.json({
      order: createdOrder[0],
      payments: createdTransactions,
      receipt: createdOrder[0]?.feePlan?.receipt || null,
    });
  } catch (error: any) {
    console.error("Error fetching order details:", error);
    return NextResponse.json(error.response.data.message, {
      status: 500,
    });
  }
}

import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import cashfree from "@/lib/cfpg_server";
import { CreateOrderRequest } from "cashfree-pg";
import { OrderStatus } from "@/generated/prisma";

export interface CreateOrderDto {
  enrollmentId: string;
  orderAmount: number;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  paymentScheduleId: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as CreateOrderDto;

    const payAmountValidation = await db.paymentSchedule.findUnique({
      where: {
        id: body.paymentScheduleId,
      },
      include: {
        fee: {
          select: {
            monthlyAmount: true,
          },
        },
      },
    });

    let orderRequestBody: CreateOrderRequest = {
      order_amount: Number(payAmountValidation?.fee.monthlyAmount),
      order_currency: "INR",
      customer_details: {
        customer_id: body.enrollmentId,
        customer_name: body.customerName,
        customer_phone: body.customerPhone,
        customer_email: body.customerEmail,
      },
      order_meta: {
        return_url: "http://localhost:3000/pay/verify?orderId={order_id}",
        payment_methods: "cc,dc,upi,app,banktransfer",
        notify_url: "https://webhook.api.sandbox.feebook.in/webhook",
      },
      order_note: "Sample Order Note",
      order_tags: {
        enrollmentId: body.enrollmentId,
        paymentScheduleId: body.paymentScheduleId,
      },
    };

    const response = await cashfree.PGCreateOrder(orderRequestBody);
    console.log("Order Created successfully:", response.data);

    await db.order.create({
      data: {
        paymentScheduleId: body.paymentScheduleId,
        cfOrderId: response.data.cf_order_id ?? "",
        orderId: response.data.order_id ?? "",
        amount: response.data.order_amount ?? 0,
        currency: response.data.order_currency,
        status: response?.data?.order_status as OrderStatus,
        customer: JSON.parse(
          JSON.stringify(response?.data?.customer_details ?? {})
        ),
        orderMeta: JSON.parse(JSON.stringify(response?.data?.order_meta ?? {})),
        orderNote: response?.data?.order_note ?? "",
        orderTags: response?.data?.order_tags ?? {},
        expiryTime: response?.data?.order_expiry_time,
        createdAt: response.data?.created_at,
      },
    });

    return NextResponse.json(response.data, { status: 201 });
  } catch (error: any) {
    console.error("Error:", error.response?.data?.message || error.message);
    return NextResponse.json(
      {
        success: false,
        error:
          error.response?.data?.message ||
          error.message ||
          "Failed to create order",
      },
      { status: 500 }
    );
  }
}

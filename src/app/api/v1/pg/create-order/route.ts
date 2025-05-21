import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import cashfree from "@/lib/cfpg_server";
import { CreateOrderRequest } from "cashfree-pg";
import { OrderStatus } from "@/generated/prisma";
import getFullName from "@/utils/getFullName";

export interface CreateOrderDto {
  consumerId?: string;
  feePlanId: string;
  memberId: string;
  providerId: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as CreateOrderDto;

    const feePlan = await db.feePlan.findUnique({
      where: {
        id: body.feePlanId,
        memberId: body.memberId,
        providerId: body.providerId,
      },
      include: {
        member: true,
      },
    });

    if (!feePlan) {
      return NextResponse.json(
        { message: "Fee Plan not found" },
        { status: 404 }
      );
    }

    if (feePlan.status === "PAID" || feePlan.isOfflinePaid) {
      return NextResponse.json(
        { message: "Fee Plan is already paid" },
        { status: 400 }
      );
    }

    let orderRequestBody: CreateOrderRequest = {
      order_amount: Number(feePlan?.amount),
      order_currency: "INR",
      customer_details: {
        customer_id: feePlan?.member?.id,
        customer_name: getFullName(
          feePlan?.member?.firstName,
          feePlan?.member?.middleName,
          feePlan?.member?.lastName
        ),
        customer_phone: feePlan?.member?.phone,
        customer_email: feePlan?.member?.email ?? undefined,
      },
      order_meta: {
        return_url:
          "http://localhost:3000/pay-direct/verify?orderId={order_id}",
        payment_methods: "cc,dc,upi,app,banktransfer",
      },
      order_note: "Sample Order Note",
      order_tags: {
        feePlanId: body.feePlanId,
        memberId: body.memberId,
        providerId: body.providerId,
        consumerId: body.consumerId ?? "",
      },
    };

    const response = await cashfree.PGCreateOrder(orderRequestBody);
    console.log("Order Created successfully:", response.data);

    await db.order.create({
      data: {
        id: response.data.order_id ?? "",
        externalOrderId: response.data.cf_order_id ?? "",
        feePlanId: body.feePlanId,
        amount: response.data.order_amount ?? 0,
        currency: response.data.order_currency,
        status: response?.data?.order_status as OrderStatus,
        paymentSessionId: response?.data?.payment_session_id ?? "",
        customer: JSON.parse(
          JSON.stringify(response?.data?.customer_details ?? {})
        ),
        orderMeta: JSON.parse(JSON.stringify(response?.data?.order_meta ?? {})),
        orderTags: response?.data?.order_tags ?? {},
        note: response?.data?.order_note ?? "",
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

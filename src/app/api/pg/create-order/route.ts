import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import cashfree from "@/lib/cfpg_server";
import { CreateOrderRequest } from "cashfree-pg";

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

    let orderRequestBody: CreateOrderRequest = {
      order_amount: body.orderAmount,
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
      },
      order_note: "Sample Order Note",
      order_tags: {
        enrollmentId: body.enrollmentId,
        paymentScheduleId: body.paymentScheduleId,
      },
    };

    const response = await cashfree.PGCreateOrder(orderRequestBody);
    console.log("Order Created successfully:", response.data);
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

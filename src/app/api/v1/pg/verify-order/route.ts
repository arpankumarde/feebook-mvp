import { NextRequest, NextResponse } from "next/server";
import cashfree from "@/lib/cfpg_server";
import db from "@/lib/db";
import { OrderStatus } from "@prisma/client";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const orderId = searchParams.get("orderId") ?? "";

  try {
    const { data } = await cashfree.PGFetchOrder(orderId);

    if (!data.order_status && !data?.order_tags?.feePlanId) {
      return NextResponse.json(data, { status: 500 });
    } else {
      await db.order.update({
        where: {
          id: orderId,
        },
        data: {
          status: data.order_status as OrderStatus,
        },
      });

      if ((data?.order_status as OrderStatus) === "PAID") {
        await db.feePlan.update({
          where: {
            id: data?.order_tags?.feePlanId as string,
          },
          data: {
            status: "PAID",
          },
        });
      }
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error("Error fetching order details:", error);
    return NextResponse.json(error.response.data.message, {
      status: 500,
    });
  }
}

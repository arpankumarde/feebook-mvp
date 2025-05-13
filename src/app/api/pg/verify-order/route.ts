import { NextRequest, NextResponse } from "next/server";
import cashfree from "@/lib/cfpg_server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const orderId = searchParams.get("orderId") ?? "";

  try {
    const response = await cashfree.PGFetchOrder(orderId);
    return NextResponse.json(response.data);
  } catch (error: any) {
    return NextResponse.json(error.response.data.message, {
      status: 500,
    });
  }
}

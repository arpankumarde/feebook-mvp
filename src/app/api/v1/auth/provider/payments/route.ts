import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";

export async function GET(request: NextRequest) {
  const providerId = request.nextUrl.searchParams.get("providerId");
  if (!providerId) {
    return NextResponse.json(
      { success: false, error: "Provider ID is required" },
      { status: 400 }
    );
  }

  try {
    const transactions = await db.transaction.findMany({
      where: {
        feePlan: {
          providerId: providerId,
        },
      },
    });

    return NextResponse.json(
      { success: true, data: transactions },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching providers:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

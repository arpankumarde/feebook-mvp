import db from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const memberId = searchParams.get("memberId");

    if (!memberId) {
      return NextResponse.json(
        { message: "Member ID is required" },
        { status: 400 }
      );
    }

    const member = await db.member.findUnique({
      where: { id: memberId },
      include: {
        provider: true,
      },
    });

    if (!member) {
      return NextResponse.json(
        { message: "Member not found" },
        { status: 404 }
      );
    }

    // get feeplans for this member whose deadlien is in next 30 days
    const feePlans = await db.feePlan.findMany({
      where: {
        memberId: member.id,
        dueDate: {
          lte: new Date(new Date().setDate(new Date().getDate() + 30)),
        },
        status: {
          not: "PAID",
        },
      },
    });

    return NextResponse.json({ success: true, data: { member, feePlans } });
  } catch (error) {
    return NextResponse.json(
      { message: "An error occurred while processing your request" },
      { status: 500 }
    );
  }
}

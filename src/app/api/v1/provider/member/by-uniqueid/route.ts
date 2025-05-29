import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { ApiErrorHandler } from "@/lib/error-handler";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const providerId = searchParams.get("providerId");
    const uniqueId = searchParams.get("uniqueId");

    if (!providerId || !uniqueId) {
      return NextResponse.json(
        { message: "Provider ID and Member ID are required" },
        { status: 400 }
      );
    }

    // Find the member by uniqueId and providerId
    const member = await db.member.findFirst({
      where: {
        providerId,
        uniqueId,
      },
      select: {
        id: true,
        firstName: true,
        middleName: true,
        lastName: true,
        uniqueId: true,
        email: true,
        phone: true,
        category: true,
        subcategory: true,
        consumerMemberships: {
          include: {
            consumer: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                phone: true,
              },
            },
          },
        },
      },
    });

    if (!member) {
      return NextResponse.json(
        { message: "Member not found" },
        { status: 404 }
      );
    }

    // Get current date and date one month from now for fee plans
    const currentDate = new Date();
    const oneMonthFromNow = new Date();
    oneMonthFromNow.setMonth(oneMonthFromNow.getMonth() + 1);

    // Find fee plans for this member with due dates up to one month from now
    const feePlans = await db.feePlan.findMany({
      where: {
        memberId: member.id,
        status: {
          not: "PAID",
        },
        dueDate: {
          lte: oneMonthFromNow,
        },
      },
      orderBy: {
        dueDate: "asc",
      },
    });

    return NextResponse.json({
      member,
      feePlans,
    });
  } catch (error) {
    return ApiErrorHandler.handleApiError(
      error,
      "Failed to fetch member details"
    );
  }
}

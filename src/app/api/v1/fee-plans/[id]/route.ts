import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { ApiErrorHandler } from "@/lib/error-handler";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: "Fee plan ID is required",
        },
        { status: 400 }
      );
    }

    const feePlanDetails = await db.feePlan.findUnique({
      where: { id },
      include: {
        member: true,
        provider: {
          select: {
            id: true,
            name: true,
            code: true,
            type: true,
            category: true,
            city: true,
            region: true,
            country: true,
          },
        },
      },
    });

    if (!feePlanDetails) {
      return NextResponse.json(
        {
          success: false,
          error: "Fee plan not found",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        feePlan: {
          id: feePlanDetails.id,
          name: feePlanDetails.name,
          description: feePlanDetails.description,
          amount: feePlanDetails.amount,
          status: feePlanDetails.status,
          dueDate: feePlanDetails.dueDate,
          isOfflinePaid: feePlanDetails.isOfflinePaid,
          consumerClaimsPaid: feePlanDetails.consumerClaimsPaid,
          receipt: feePlanDetails.receipt,
        },
        member: feePlanDetails.member,
        provider: feePlanDetails.provider,
      },
    });
  } catch (error) {
    console.error("Error fetching fee plan details:", error);
    return ApiErrorHandler.handlePrismaError(error);
  }
}

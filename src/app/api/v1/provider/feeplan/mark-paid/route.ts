import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { ApiErrorHandler } from "@/lib/error-handler";

export async function POST(request: NextRequest) {
  try {
    const { feePlanId, isOfflinePaid, providerId } = await request.json();

    if (!feePlanId || typeof isOfflinePaid !== "boolean" || !providerId) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Fee plan ID, provider ID, and offline payment status are required",
        },
        { status: 400 }
      );
    }

    // Verify the fee plan belongs to the provider
    const feePlan = await db.feePlan.findFirst({
      where: {
        id: feePlanId,
        providerId: providerId,
      },
      include: {
        member: {
          select: {
            firstName: true,
            lastName: true,
            uniqueId: true,
          },
        },
      },
    });

    if (!feePlan) {
      return NextResponse.json(
        {
          success: false,
          error: "Fee plan not found or you don't have permission to modify it",
        },
        { status: 404 }
      );
    }

    // Check if fee is already paid online
    if (feePlan.status === "PAID" && !feePlan.isOfflinePaid) {
      return NextResponse.json(
        {
          success: false,
          error: "This fee has already been paid online and cannot be modified",
        },
        { status: 400 }
      );
    }

    // Update the fee plan
    const updatedFeePlan = await db.feePlan.update({
      where: {
        id: feePlanId,
      },
      data: {
        isOfflinePaid: isOfflinePaid,
        status: isOfflinePaid ? "PAID" : "DUE",
        updatedAt: new Date(),
      },
      include: {
        member: {
          select: {
            firstName: true,
            lastName: true,
            uniqueId: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: isOfflinePaid
        ? "Fee plan marked as paid successfully"
        : "Fee plan marked as unpaid successfully",
      data: updatedFeePlan,
    });
  } catch (error) {
    console.error("Error updating fee plan payment status:", error);
    return ApiErrorHandler.handlePrismaError(error);
  }
}

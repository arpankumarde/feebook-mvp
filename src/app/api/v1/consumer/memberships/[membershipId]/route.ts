import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { ApiErrorHandler } from "@/lib/error-handler";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ membershipId: string }> }
) {
  try {
    const { membershipId } = await params;

    if (!membershipId) {
      return NextResponse.json(
        {
          success: false,
          error: "Membership ID is required",
        },
        { status: 400 }
      );
    }

    // Fetch detailed membership information
    const membership = await db.consumerMember.findUnique({
      where: { id: membershipId },
      include: {
        member: {
          include: {
            provider: {
              select: {
                id: true,
                name: true,
                code: true,
                category: true,
                type: true,
                city: true,
                region: true,
                country: true,
              },
            },
            feePlans: {
              orderBy: {
                dueDate: "asc",
              },
              select: {
                id: true,
                name: true,
                description: true,
                amount: true,
                status: true,
                receipt: true,
                dueDate: true,
                isOfflinePaid: true,
                consumerClaimsPaid: true,
                createdAt: true,
                updatedAt: true,
              },
            },
          },
        },
        consumer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
            email: true,
          },
        },
      },
    });

    if (!membership) {
      return NextResponse.json(
        {
          success: false,
          error: "Membership not found",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: membership,
    });
  } catch (error) {
    console.error("Error fetching membership details:", error);
    return ApiErrorHandler.handlePrismaError(error);
  }
}

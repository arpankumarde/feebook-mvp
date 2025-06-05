import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { ApiErrorHandler } from "@/lib/error-handler";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const consumerId = searchParams.get("consumerId");

    if (!consumerId) {
      return NextResponse.json(
        {
          success: false,
          error: "Consumer ID is required",
        },
        { status: 400 }
      );
    }

    const memberships = await db.consumerMember.findMany({
      where: { consumerId },
      include: {
        member: {
          include: {
            provider: {
              select: {
                name: true,
                category: true,
              },
            },
            feePlans: {
              where: {
                status: {
                  in: ["DUE", "OVERDUE"],
                },
              },
              select: {
                id: true,
                status: true,
                dueDate: true,
              },
            },
          },
        },
      },
    });

    const simplifiedMemberships = memberships.map((membership) => {
      const memberName = [
        membership.member.firstName,
        membership.member.middleName,
        membership.member.lastName,
      ]
        .filter(Boolean)
        .join(" ");

      const pendingFeePlans = membership.member.feePlans;
      const hasOverdue = pendingFeePlans.some((plan) => {
        const dueDate = new Date(plan.dueDate);
        return dueDate < new Date() && plan.status !== "PAID";
      });

      return {
        id: membership.id,
        claimedAt: membership.claimedAt,
        memberName,
        memberUniqueId: membership.member.uniqueId,
        providerName: membership.member.provider.name,
        providerCategory: membership.member.provider.category,
        pendingFeePlansCount: pendingFeePlans.length,
        hasOutstandingFees: pendingFeePlans.length > 0,
        hasOverdueFees: hasOverdue,
      };
    });

    return NextResponse.json({
      success: true,
      memberships: simplifiedMemberships,
    });
  } catch (error) {
    console.error("Error fetching simplified memberships:", error);
    return ApiErrorHandler.handlePrismaError(error);
  }
}

import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { ApiErrorHandler } from "@/lib/error-handler";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const providerId = searchParams.get("providerId");

    if (!providerId) {
      return NextResponse.json(
        {
          success: false,
          error: "Provider ID is required",
        },
        { status: 400 }
      );
    }

    // Fetch members with simplified data for listing
    const members = await db.member.findMany({
      where: {
        providerId: providerId,
      },
      select: {
        id: true,
        firstName: true,
        middleName: true,
        lastName: true,
        uniqueId: true,
        phone: true,
        email: true,
        category: true,
        subcategory: true,
        createdAt: true,
        feePlans: {
          where: {
            status: {
              not: "PAID",
            },
          },
          select: {
            id: true,
            status: true,
            amount: true,
            dueDate: true,
          },
        },
        consumerMemberships: {
          select: {
            id: true,
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
      orderBy: {
        createdAt: "desc",
      },
    });

    // Transform data for simplified display
    const simplifiedMembers = members.map((member) => {
      const memberName = [member.firstName, member.middleName, member.lastName]
        .filter(Boolean)
        .join(" ");

      const pendingFeePlans = member.feePlans || [];
      const totalPendingAmount = pendingFeePlans.reduce(
        (sum, plan) => sum + Number(plan.amount),
        0
      );

      const overdueFeePlans = pendingFeePlans.filter(
        (plan) => new Date(plan.dueDate) < new Date()
      );

      return {
        id: member.id,
        memberName,
        uniqueId: member.uniqueId,
        phone: member.phone,
        email: member.email,
        category: member.category,
        subcategory: member.subcategory,
        joinedAt: member.createdAt,
        pendingFeePlansCount: pendingFeePlans.length,
        totalPendingAmount,
        hasOverdueFees: overdueFeePlans.length > 0,
        overdueFeePlansCount: overdueFeePlans.length,
        isLinkedToConsumer: member.consumerMemberships.length > 0,
        linkedConsumer: member.consumerMemberships[0]?.consumer || null,
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        members: simplifiedMembers,
        totalMembers: simplifiedMembers.length,
        totalPendingFees: simplifiedMembers.reduce(
          (sum, member) => sum + member.pendingFeePlansCount,
          0
        ),
        totalMembersWithOverdueFees: simplifiedMembers.filter(
          (member) => member.hasOverdueFees
        ).length,
      },
    });
  } catch (error) {
    console.error("Error fetching simplified members:", error);
    return ApiErrorHandler.handlePrismaError(error);
  }
}

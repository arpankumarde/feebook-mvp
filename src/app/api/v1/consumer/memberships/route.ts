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

    // Verify consumer exists
    const consumer = await db.consumer.findUnique({
      where: { id: consumerId },
    });

    if (!consumer) {
      return NextResponse.json(
        {
          success: false,
          error: "Consumer not found",
        },
        { status: 404 }
      );
    }

    // Fetch consumer memberships with detailed information
    const consumerMemberships = await db.consumerMember.findMany({
      where: { consumerId },
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
              },
            },
            feePlans: {
              where: {
                status: {
                  not: "PAID",
                },
              },
              orderBy: {
                dueDate: "asc",
              },
              select: {
                id: true,
                name: true,
                description: true,
                amount: true,
                status: true,
                dueDate: true,
                isOfflinePaid: true,
                consumerClaimsPaid: true,
              },
            },
          },
        },
      },
      orderBy: {
        claimedAt: "desc",
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        memberships: consumerMemberships,
        totalMemberships: consumerMemberships.length,
        totalPendingFees: consumerMemberships.reduce(
          (total, membership) => total + membership.member.feePlans.length,
          0
        ),
      },
      memberships: consumerMemberships, // Keep for backward compatibility
    });
  } catch (error) {
    console.error("Error fetching consumer memberships:", error);
    return ApiErrorHandler.handlePrismaError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const { consumerId, providerCode, memberUniqueId } = await request.json();

    // Validate required fields
    if (!consumerId || !providerCode || !memberUniqueId) {
      return NextResponse.json(
        {
          error:
            "Consumer ID, Provider Code, and Member Unique ID are required",
        },
        { status: 400 }
      );
    }

    // Verify consumer exists
    const consumer = await db.consumer.findUnique({
      where: { id: consumerId },
    });

    if (!consumer) {
      return NextResponse.json(
        { error: "Consumer not found" },
        { status: 404 }
      );
    }

    // Find provider by code
    const provider = await db.provider.findUnique({
      where: { code: providerCode },
    });

    if (!provider) {
      return NextResponse.json(
        { error: "Provider not found" },
        { status: 404 }
      );
    }

    // Find member using provider ID and unique ID
    const member = await db.member.findUnique({
      where: {
        providerId_uniqueId: {
          providerId: provider.id,
          uniqueId: memberUniqueId,
        },
      },
    });

    if (!member) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    // Check if consumer already claimed this membership
    const existingClaimship = await db.consumerMember.findUnique({
      where: {
        consumerId_memberId: {
          consumerId,
          memberId: member.id,
        },
      },
    });

    if (existingClaimship) {
      return NextResponse.json(
        {
          error: "Membership already claimed",
          membership: existingClaimship,
        },
        { status: 409 }
      );
    }

    // Create the consumer-member relationship with transaction
    const consumerMembershipClaim = await db.$transaction(async (tx) => {
      const newConsumerMember = await tx.consumerMember.create({
        data: {
          consumerId,
          memberId: member.id,
        },
        include: {
          member: {
            include: {
              provider: {
                select: {
                  id: true,
                  name: true,
                  code: true,
                  category: true,
                },
              },
              feePlans: {
                where: {
                  status: {
                    not: "PAID",
                  },
                },
                orderBy: {
                  dueDate: "asc",
                },
              },
            },
          },
        },
      });

      return newConsumerMember;
    });

    return NextResponse.json({
      success: true,
      message: "Membership claimed successfully",
      data: {
        membershipId: consumerMembershipClaim.id,
        member: consumerMembershipClaim.member,
        claimedAt: consumerMembershipClaim.claimedAt,
        pendingFeePlans: consumerMembershipClaim.member.feePlans.length,
      },
    });
  } catch (error) {
    console.error("Error claiming membership:", error);
    return ApiErrorHandler.handlePrismaError(error);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const consumerId = searchParams.get("consumerId");
    const memberId = searchParams.get("memberId");

    if (!consumerId || !memberId) {
      return NextResponse.json(
        {
          success: false,
          error: "Consumer ID and Member ID are required",
        },
        { status: 400 }
      );
    }

    // Verify the membership exists and belongs to the consumer
    const existingMembership = await db.consumerMember.findUnique({
      where: {
        consumerId_memberId: {
          consumerId,
          memberId,
        },
      },
      include: {
        member: {
          include: {
            provider: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    if (!existingMembership) {
      return NextResponse.json(
        {
          success: false,
          error: "Membership not found or does not belong to this consumer",
        },
        { status: 404 }
      );
    }

    // Check if there are any pending transactions for this membership
    const pendingTransactions = await db.transaction.findMany({
      where: {
        consumerId,
        feePlan: {
          memberId,
        },
        status: {
          in: ["PENDING", "NOT_ATTEMPTED"],
        },
      },
    });

    if (pendingTransactions.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Cannot remove membership with pending transactions. Please complete or cancel pending payments first.",
        },
        { status: 400 }
      );
    }

    // Remove the membership
    const deletedMembership = await db.consumerMember.delete({
      where: {
        consumerId_memberId: {
          consumerId,
          memberId,
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: `Membership with ${existingMembership.member.provider.name} removed successfully`,
      data: {
        deletedMembership,
        memberName: `${existingMembership.member.firstName} ${existingMembership.member.lastName}`,
        providerName: existingMembership.member.provider.name,
      },
    });
  } catch (error) {
    console.error("Error removing membership:", error);
    return ApiErrorHandler.handlePrismaError(error);
  }
}

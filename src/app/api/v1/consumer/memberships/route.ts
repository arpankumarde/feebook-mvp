import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { ApiErrorHandler } from "@/lib/error-handler";

export async function GET(request: NextRequest) {
  const { consumerId }: { consumerId: string } = await request.json();

  if (!consumerId) {
    return NextResponse.json(
      { error: "Consumer ID is required" },
      { status: 400 }
    );
  }

  try {
    const memberships = await db.consumerMember.findMany({
      where: { consumerId },
      include: {
        member: {
          include: {
            provider: true,
          },
        },
      },
    });

    return NextResponse.json({ memberships });
  } catch (error) {
    console.error("Error fetching memberships:", error);
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

import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { ApiErrorHandler } from "@/lib/error-handler";

interface ClaimMembershipRequest {
  consumerId: string;
  providerId: string;
  memberUniqueId: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: ClaimMembershipRequest = await request.json();
    const { consumerId, providerId, memberUniqueId } = body;

    // Validate required fields
    if (!consumerId || !providerId || !memberUniqueId) {
      return NextResponse.json(
        {
          success: false,
          error: "Consumer ID, Provider ID, and Member Unique ID are required",
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

    // Verify provider exists and is approved
    const provider = await db.provider.findUnique({
      where: {
        id: providerId,
        isVerified: true,
        // status: "APPROVED"
      },
    });

    if (!provider) {
      return NextResponse.json(
        {
          success: false,
          error: "Provider not found or not verified",
        },
        { status: 404 }
      );
    }

    // Find member using provider ID and unique ID
    const member = await db.member.findUnique({
      where: {
        providerId_uniqueId: {
          providerId,
          uniqueId: memberUniqueId,
        },
      },
      include: {
        provider: {
          select: {
            name: true,
            category: true,
          },
        },
      },
    });

    if (!member) {
      return NextResponse.json(
        {
          success: false,
          error: "Member not found with the provided details",
        },
        { status: 404 }
      );
    }

    // Check if consumer already claimed this membership
    const existingMembership = await db.consumerMember.findUnique({
      where: {
        consumerId_memberId: {
          consumerId,
          memberId: member.id,
        },
      },
    });

    if (existingMembership) {
      return NextResponse.json(
        {
          success: false,
          error: "Membership already claimed",
          data: {
            membershipId: existingMembership.id,
            claimedAt: existingMembership.claimedAt,
          },
        },
        { status: 409 }
      );
    }

    // Create the consumer-member relationship
    const newMembership = await db.consumerMember.create({
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
              select: {
                id: true,
                name: true,
                amount: true,
                status: true,
                dueDate: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: "Membership claimed successfully",
      data: {
        id: newMembership.id,
        member: newMembership.member,
        claimedAt: newMembership.claimedAt,
        pendingFeePlans: newMembership.member.feePlans.length,
      },
    });
  } catch (error) {
    console.error("Error claiming membership:", error);
    return ApiErrorHandler.handlePrismaError(error);
  }
}

import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { Member } from "@prisma/client";
import { ApiErrorHandler } from "@/lib/error-handler";

export async function POST(request: NextRequest) {
  try {
    const { member }: { member: Member } = await request.json();
    let memberData = member;

    if (member.dateOfBirth) {
      memberData = {
        ...member,
        dateOfBirth: new Date(member.dateOfBirth),
      };
    }

    const newMember = await db.member.create({
      data: memberData,
    });

    return NextResponse.json(newMember);
  } catch (error) {
    return ApiErrorHandler.handlePrismaError(error);
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const providerId = searchParams.get("providerId");
    const memberId = searchParams.get("memberId");

    if (!providerId) {
      return NextResponse.json(
        { error: "Provider ID is required" },
        { status: 400 }
      );
    }

    const whereClause = {
      providerId: providerId,
      ...(memberId && { uniqueId: memberId }),
    };

    const includeClause = {
      feePlans: true,
      consumerMemberships: {
        include: {
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
      },
    };

    if (memberId) {
      const member = await db.member.findFirst({
        where: whereClause,
        include: includeClause,
      });

      return NextResponse.json(member);
    } else {
      const members = await db.member.findMany({
        where: whereClause,
        include: includeClause,
      });

      return NextResponse.json(members);
    }
  } catch (error) {
    return ApiErrorHandler.handleApiError(error, "Failed to fetch members");
  }
}

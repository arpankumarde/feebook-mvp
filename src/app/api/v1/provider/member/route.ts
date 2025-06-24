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

    return NextResponse.json({ success: true, data: newMember });
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
        { success: false, error: "Provider ID is required" },
        { status: 400 }
      );
    }

    const whereClause = {
      providerId: providerId,
      ...(memberId && { id: memberId }),
    };

    const includeClause = {
      feePlans: true,
    };

    if (memberId) {
      const member = await db.member.findFirst({
        where: whereClause,
        include: includeClause,
      });

      return NextResponse.json({ success: true, data: member });
    } else {
      const members = await db.member.findMany({
        where: whereClause,
        include: includeClause,
      });

      return NextResponse.json({ success: true, data: members });
    }
  } catch (error) {
    return ApiErrorHandler.handleApiError(error, "Failed to fetch members");
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { member }: { member: Member & { id: string } } =
      await request.json();

    if (!member.id) {
      return NextResponse.json(
        { error: "Member ID is required" },
        { status: 400 }
      );
    }

    let memberData = { ...member, gender: member.gender || null };

    if (member.dateOfBirth) {
      memberData = {
        ...memberData,
        dateOfBirth: new Date(member.dateOfBirth),
      };
    }

    const updatedMember = await db.member.update({
      where: { id: member.id },
      data: memberData,
    });

    return NextResponse.json({ success: true, data: updatedMember });
  } catch (error) {
    return ApiErrorHandler.handlePrismaError(error);
  }
}

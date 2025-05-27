import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { Member, Prisma } from "@prisma/client";

export async function POST(request: NextRequest) {
  try {
    const { member }: { member: Member } = await request.json();
    let modMember = member;

    if (member.dateOfBirth) {
      modMember = {
        ...member,
        dateOfBirth: new Date(member.dateOfBirth),
      };
    }

    const newMember = await db.member.create({
      data: modMember,
    });

    return NextResponse.json(newMember);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      // Known request errors (e.g., unique constraint violations)
      console.log(
        "Prisma known request error:",
        error.message,
        "Code:",
        error.code
      );
      return NextResponse.json(
        { error: "Database constraint violation", code: error.code },
        { status: 400 }
      );
    } else if (error instanceof Prisma.PrismaClientValidationError) {
      // Validation errors (e.g., missing required fields)
      console.log("Prisma validation error:", error.message);
      return NextResponse.json(
        { error: "Invalid data format" },
        { status: 400 }
      );
    } else if (error instanceof Prisma.PrismaClientRustPanicError) {
      // Rust panic errors (internal Prisma errors)
      console.log("Prisma internal error:", error.message);
      return NextResponse.json(
        { error: "Critical database error" },
        { status: 500 }
      );
    } else if (error instanceof Prisma.PrismaClientInitializationError) {
      // Initialization errors
      console.log("Prisma initialization error:", error.message);
      return NextResponse.json(
        { error: "Database connection error" },
        { status: 503 }
      );
    } else if (error instanceof Prisma.PrismaClientUnknownRequestError) {
      // Unknown request errors
      console.log("Prisma error:", error.message);
      return NextResponse.json(
        { error: "Database error occurred" },
        { status: 500 }
      );
    } else {
      console.error("Error creating member:", error);
      return NextResponse.json(
        { error: "Failed to create member" },
        { status: 500 }
      );
    }
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const providerId = searchParams.get("providerId");
  const memberId = searchParams.get("memberId");

  if (!providerId)
    return NextResponse.json(
      { error: "Provider ID is required" },
      { status: 400 }
    );

  if (memberId && providerId) {
    const member = await db.member.findUnique({
      where: {
        providerId_uniqueId: {
          providerId: providerId,
          uniqueId: memberId,
        },
      },
      include: {
        feePlans: true,
      },
    });

    return NextResponse.json(member);
  } else if (providerId) {
    const member = await db.member.findFirst({
      where: {
        providerId: providerId,
      },
      include: {
        feePlans: true,
      },
    });

    return NextResponse.json(member);
  } else {
    const members = await db.member.findMany({
      where: {
        providerId: providerId,
      },
      include: {
        feePlans: true,
      },
    });

    return NextResponse.json(members);
  }
}

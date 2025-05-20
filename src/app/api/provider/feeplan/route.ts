import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { FeePlan, Member, Prisma } from "@/generated/prisma";

export async function POST(request: NextRequest) {
  try {
    const { feePlan }: { feePlan: FeePlan } = await request.json();
    const newFeePlan = await db.feePlan.create({
      data: feePlan,
    });

    return NextResponse.json(newFeePlan);
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
      // Other unexpected errors
      console.error("Unexpected error:", error);
      return NextResponse.json(
        { error: "An unexpected error occurred" },
        { status: 500 }
      );
    }
  }
}

export async function PUT(request: NextRequest) {
  const { feePlan }: { feePlan: FeePlan } = await request.json();

  if (!feePlan.id)
    return NextResponse.json(
      { error: "Fee Plan ID is required" },
      { status: 400 }
    );

  try {
    const updatedFeePlan = await db.feePlan.update({
      where: {
        id: feePlan.id,
      },
      data: feePlan,
    });

    return NextResponse.json(updatedFeePlan);
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
      // Other unexpected errors
      console.error("Unexpected error:", error);
      return NextResponse.json(
        { error: "An unexpected error occurred" },
        { status: 500 }
      );
    }
  }
}

export async function DELETE(request: NextRequest) {
  const { feePlanId }: { feePlanId: string } = await request.json();

  if (!feePlanId)
    return NextResponse.json(
      { error: "Fee Plan ID is required" },
      { status: 400 }
    );

  try {
    const deletedFeePlan = await db.feePlan.delete({
      where: {
        id: feePlanId,
      },
    });

    return NextResponse.json(deletedFeePlan);
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
      // Other unexpected errors
      console.error("Unexpected error:", error);
      return NextResponse.json(
        { error: "An unexpected error occurred" },
        { status: 500 }
      );
    }
  }
}

import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { FeePlan } from "@prisma/client";
import { ApiErrorHandler } from "@/lib/error-handler";

export async function POST(request: NextRequest) {
  try {
    const { feePlan }: { feePlan: FeePlan } = await request.json();
    const newFeePlan = await db.feePlan.create({
      data: feePlan,
    });

    return NextResponse.json(newFeePlan);
  } catch (error) {
    return ApiErrorHandler.handlePrismaError(error);
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { feePlan }: { feePlan: FeePlan } = await request.json();

    if (!feePlan.id) {
      return NextResponse.json(
        { error: "Fee Plan ID is required" },
        { status: 400 }
      );
    }

    const updatedFeePlan = await db.feePlan.update({
      where: {
        id: feePlan.id,
      },
      data: feePlan,
    });

    return NextResponse.json(updatedFeePlan);
  } catch (error) {
    return ApiErrorHandler.handlePrismaError(error);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { feePlanId }: { feePlanId: string } = await request.json();

    if (!feePlanId) {
      return NextResponse.json(
        { error: "Fee Plan ID is required" },
        { status: 400 }
      );
    }

    const deletedFeePlan = await db.feePlan.delete({
      where: {
        id: feePlanId,
      },
    });

    return NextResponse.json(deletedFeePlan);
  } catch (error) {
    return ApiErrorHandler.handlePrismaError(error);
  }
}

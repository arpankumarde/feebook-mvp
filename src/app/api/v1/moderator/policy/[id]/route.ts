import db from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { ApiErrorHandler } from "@/lib/error-handler";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Policy ID is required" },
        { status: 400 }
      );
    }

    const policyDetails = await db.policy.findUnique({
      where: { id },
    });

    if (!policyDetails) {
      return NextResponse.json(
        { success: false, error: "Policy not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: policyDetails,
    });
  } catch (error) {
    ApiErrorHandler.handlePrismaError(error);
    ApiErrorHandler.handleApiError(error);
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Policy ID is required" },
        { status: 400 }
      );
    }

    const body = await request.json();

    const updatedPolicy = await db.policy.update({
      where: { id },
      data: body,
    });

    return NextResponse.json({
      success: true,
      data: updatedPolicy,
    });
  } catch (error) {
    ApiErrorHandler.handlePrismaError(error);
    ApiErrorHandler.handleApiError(error);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Policy ID is required" },
        { status: 400 }
      );
    }

    await db.policy.delete({
      where: { id },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    ApiErrorHandler.handlePrismaError(error);
    ApiErrorHandler.handleApiError(error);
  }
}

import { NextResponse } from "next/server";
import db from "@/lib/db";
import { ApiErrorHandler } from "@/lib/error-handler";

export async function GET() {
  try {
    const policies = await db.policy.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({
      success: true,
      data: policies,
    });
  } catch (error) {
    ApiErrorHandler.handleApiError(error);
    ApiErrorHandler.handlePrismaError(error);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, slug, content } = body;

    if (!name || !slug || !content) {
      return NextResponse.json(
        { success: false, message: "All fields are required." },
        { status: 400 }
      );
    }

    const newPolicy = await db.policy.create({
      data: {
        name,
        slug,
        content,
      },
    });

    return NextResponse.json({
      success: true,
      data: newPolicy,
    });
  } catch (error) {
    ApiErrorHandler.handleApiError(error);
    ApiErrorHandler.handlePrismaError(error);
  }
}

export async function DELETE(request: Request) {
  try {
    const body = await request.json();
    const { policyId } = body;

    if (!policyId) {
      return NextResponse.json(
        { success: false, message: "Policy ID is required." },
        { status: 400 }
      );
    }

    const deletedPolicy = await db.policy.delete({
      where: { id: policyId },
    });

    return NextResponse.json({
      success: true,
      data: deletedPolicy,
    });
  } catch (error) {
    ApiErrorHandler.handleApiError(error);
    ApiErrorHandler.handlePrismaError(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { policyId, name, slug, content } = body;

    if (!policyId || !name || !slug || !content) {
      return NextResponse.json(
        { success: false, message: "All fields are required." },
        { status: 400 }
      );
    }

    const updatedPolicy = await db.policy.update({
      where: { id: policyId },
      data: {
        name,
        slug,
        content,
      },
    });

    return NextResponse.json({
      success: true,
      data: updatedPolicy,
    });
  } catch (error) {
    ApiErrorHandler.handleApiError(error);
    ApiErrorHandler.handlePrismaError(error);
  }
}

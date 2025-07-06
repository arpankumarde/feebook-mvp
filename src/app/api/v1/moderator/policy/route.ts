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

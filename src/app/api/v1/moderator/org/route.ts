import { NextResponse } from "next/server";
import db from "@/lib/db";
import { ApiErrorHandler } from "@/lib/error-handler";

export async function GET() {
  try {
    const organizations = await db.provider.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({
      success: true,
      data: organizations,
    });
  } catch (error) {
    ApiErrorHandler.handleApiError(error);
    ApiErrorHandler.handlePrismaError(error);
  }
}

import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { ApiErrorHandler } from "@/lib/error-handler";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "10", 10);

    const skip = (page - 1) * limit;

    const [transactions, total] = await Promise.all([
      db.transaction.findMany({
        skip,
        take: limit,
      }),
      db.transaction.count(),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        transactions,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    ApiErrorHandler.handleApiError(error);
    ApiErrorHandler.handlePrismaError(error);
  }
}

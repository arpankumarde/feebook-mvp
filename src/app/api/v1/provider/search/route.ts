import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { ApiErrorHandler } from "@/lib/error-handler";
import { AccountCategory, Prisma } from "@prisma/client";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category") as AccountCategory;
    const region = searchParams.get("region");
    const search = searchParams.get("search");
    const limit = parseInt(searchParams.get("limit") || "10");

    if (!category) {
      return NextResponse.json(
        {
          success: false,
          error: "Category is required",
        },
        { status: 400 }
      );
    }

    // Build where clause
    const whereClause: Prisma.ProviderWhereInput = {
      category,
      isVerified: true,
      //   status: "APPROVED",
    };

    // Add region filter if provided
    if (region) {
      whereClause.region = region;
    }

    // Add search filter if provided
    if (search && search.trim()) {
      whereClause.name = {
        contains: search.trim(),
        mode: "insensitive",
      };
    }

    const providers = await db.provider.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        code: true,
        category: true,
        region: true,
        type: true,
        email: true,
        phone: true,
      },
      orderBy: [
        {
          name: "asc",
        },
      ],
      take: limit,
    });

    return NextResponse.json({
      success: true,
      data: {
        providers,
        total: providers.length,
      },
    });
  } catch (error) {
    console.error("Error searching providers:", error);
    return ApiErrorHandler.handlePrismaError(error);
  }
}

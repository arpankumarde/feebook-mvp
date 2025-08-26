import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { ApiErrorHandler } from "@/lib/error-handler";
import { Provider } from "@prisma/client";

export async function GET({ params }: { params: Promise<{ code: string }> }) {
  try {
    const { code } = await params;

    if (!code) {
      return NextResponse.json(
        {
          success: false,
          error: "Organization code is required",
        },
        { status: 400 }
      );
    }

    const provider = await db.provider.findUnique({
      where: { code },
      select: {
        id: true,
        name: true,
        code: true,
        type: true,
        category: true,
      },
    });

    if (!provider) {
      return NextResponse.json(
        {
          success: false,
          error: "Organization not found",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: provider,
    });
  } catch (error) {
    console.error("Error fetching provider by code:", error);
    return ApiErrorHandler.handlePrismaError(error);
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    if (!code) {
      return NextResponse.json(
        { success: false, error: "Organization code is required" },
        { status: 400 }
      );
    }

    const body = (await request.json()) as Provider;

    const updatedProvider = await db.provider.update({
      where: { code },
      data: body,
    });

    return NextResponse.json({
      success: true,
      data: updatedProvider,
    });
  } catch (error) {
    console.error("Error updating provider by code:", error);
    return ApiErrorHandler.handlePrismaError(error);
  }
}

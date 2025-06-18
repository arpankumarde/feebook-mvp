import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { ApiErrorHandler } from "@/lib/error-handler";

interface UpdateConsumerRequest {
  firstName?: string;
  lastName?: string;
  email?: string;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const consumerId = searchParams.get("consumerId");

    if (!consumerId) {
      return NextResponse.json(
        {
          success: false,
          error: "Consumer ID is required",
        },
        { status: 400 }
      );
    }

    const consumer = await db.consumer.findUnique({
      where: { id: consumerId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        isPhoneVerified: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!consumer) {
      return NextResponse.json(
        {
          success: false,
          error: "Consumer not found",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: consumer,
    });
  } catch (error) {
    console.error("Error fetching consumer profile:", error);
    return ApiErrorHandler.handlePrismaError(error);
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const consumerId = searchParams.get("consumerId");

    if (!consumerId) {
      return NextResponse.json(
        {
          success: false,
          error: "Consumer ID is required",
        },
        { status: 400 }
      );
    }

    const body: UpdateConsumerRequest = await request.json();

    // Verify consumer exists
    const existingConsumer = await db.consumer.findUnique({
      where: { id: consumerId },
    });

    if (!existingConsumer) {
      return NextResponse.json(
        {
          success: false,
          error: "Consumer not found",
        },
        { status: 404 }
      );
    }

    // Validate email format if provided
    if (body.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid email format",
        },
        { status: 400 }
      );
    }

    // Prepare update data (exclude phone)
    const updateData: any = {};

    if (body.firstName !== undefined) updateData.firstName = body.firstName;
    if (body.lastName !== undefined) updateData.lastName = body.lastName;
    if (body.email !== undefined) updateData.email = body.email;

    const updatedConsumer = await db.consumer.update({
      where: { id: consumerId },
      data: updateData,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        isPhoneVerified: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: updatedConsumer,
      message: "Profile updated successfully",
    });
  } catch (error) {
    console.error("Error updating consumer profile:", error);
    return ApiErrorHandler.handlePrismaError(error);
  }
}

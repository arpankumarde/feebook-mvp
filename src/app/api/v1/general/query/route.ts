import db from "@/lib/db";
import { ApiErrorHandler } from "@/lib/error-handler";
import { Query } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as Query;

    // Validate required fields - at least one of email or phone is required
    if (!body.email && !body.phone) {
      return NextResponse.json(
        { error: "Either email or phone is required." },
        { status: 400 }
      );
    }

    // validate if message is provided
    if (!body.message) {
      return NextResponse.json(
        { error: "Message is required." },
        { status: 400 }
      );
    }

    const newQuery = await db.query.create({
      data: body,
    });

    return NextResponse.json(newQuery);
  } catch (error) {
    console.error("Error creating query:", error);
    return ApiErrorHandler.handlePrismaError(error);
  }
}

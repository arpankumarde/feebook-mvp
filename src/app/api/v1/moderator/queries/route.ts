import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const queries = await prisma.query.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({
      success: true,
      data: queries,
    });
  } catch (error) {
    console.error("Error fetching queries:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch queries",
      },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { queryId } = body;

    if (!queryId) {
      return NextResponse.json(
        {
          success: false,
          error: "Query ID is required",
        },
        { status: 400 }
      );
    }

    const updatedQuery = await prisma.query.update({
      where: {
        id: queryId,
      },
      data: {
        status: "RESOLVED",
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      data: updatedQuery,
    });
  } catch (error) {
    console.error("Error updating query:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to update query",
      },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: { code: string } }
) {
  try {
    const { code } = params;

    if (!code) {
      return NextResponse.json(
        { message: "Organization code is required" },
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
        { message: "Organization not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(provider);
  } catch (error) {
    console.error("Error fetching provider by code:", error);
    return NextResponse.json(
      { message: "Failed to fetch organization details" },
      { status: 500 }
    );
  }
}

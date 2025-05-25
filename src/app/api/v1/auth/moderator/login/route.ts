import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import db from "@/lib/db";

export async function POST(request: NextRequest) {
  const { email, password } = await request.json();

  // Validate input
  if (!email || !password) {
    return NextResponse.json(
      {
        success: false,
        error: "All fields are required",
        message: "All fields are required",
      },
      { status: 400 }
    );
  }

  try {
    // Check if moderator exists
    const existingModerator = await db.moderator.findUnique({
      where: { email },
    });

    if (!existingModerator) {
      return NextResponse.json(
        {
          success: false,
          error: "Moderator not found",
          message: "Moderator not found",
        },
        { status: 404 }
      );
    }

    const isPasswordValid = await bcrypt.compare(
      password,
      existingModerator.password
    );

    if (!isPasswordValid) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid password",
          message: "Invalid password",
        },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { success: true, user: existingModerator, message: "Login successful" },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, error, message: "An error occurred during login" },
      { status: 500 }
    );
  }
}
